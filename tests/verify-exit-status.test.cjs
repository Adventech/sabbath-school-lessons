"use strict"

const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")
const vm = require("node:vm")

const verifierPath = path.join(__dirname, "..", "verify.js")
const verifierSource = fs.readFileSync(verifierPath, "utf8")

async function runVerifier({ pullRequest = false, rejectComment = false } = {}) {
    const state = {
        errors: [],
        failed: [],
        posts: 0,
    }
    const sandboxProcess = {
        env: pullRequest ? { GITHUB_EVENT_PATH: "event.json" } : {},
        exitCode: 0,
    }

    const fakeFs = {
        pathExistsSync(file) {
            return pullRequest && file === "event.json"
        },
        readFileSync(file) {
            if (file === "event.json") {
                return JSON.stringify({ pull_request: { number: 123 } })
            }
            return "start_date: 01/01/2099\n"
        },
    }

    const fakeGlob = {
        sync(pattern) {
            if (pattern === "src/**/2099-01?(-cq|-er)") {
                return ["src/en/ss/2099-01"]
            }
            return []
        },
    }

    function fakeMoment(value) {
        return {
            add() {
                return this
            },
            format() {
                return value || "Invalid date"
            },
        }
    }

    function sandboxRequire(request) {
        switch (request) {
            case "./deploy-helper":
                return { getCompilationQuarterValue: () => "2099-01" }
            case "./lib/meta-marked":
            case "meta-marked":
                return () => ({ meta: {} })
            case "fs-extra":
                return fakeFs
            case "js-yaml":
                return { load: () => ({ start_date: "01/01/2099" }) }
            case "./lib/glob":
            case "glob":
                return fakeGlob
            case "moment":
                return fakeMoment
            case "axios":
                return async () => {
                    state.posts += 1
                    if (rejectComment) {
                        throw new Error("comment endpoint unavailable")
                    }
                }
            case "@actions/core":
                return {
                    setFailed(message) {
                        state.failed.push(message)
                        sandboxProcess.exitCode = 1
                    },
                }
            case "path":
                return path
            default:
                throw new Error(`Unexpected verifier dependency: ${request}`)
        }
    }

    const result = vm.runInNewContext(verifierSource, {
        console: {
            error(message) {
                state.errors.push(String(message))
            },
        },
        process: sandboxProcess,
        require: sandboxRequire,
    }, { filename: verifierPath })

    try {
        await result
    } catch (error) {
        state.evaluationError = error
    }

    state.exitCode = sandboxProcess.exitCode
    return state
}

test("content failures return a non-zero status outside a pull request", async () => {
    const state = await runVerifier()

    assert.equal(state.errors.length, 1, "the local report should still be printed")
    assert.equal(state.failed.length, 1, "content failure must reach the process status")
    assert.equal(state.exitCode, 1)
})

test("comment-reporting failure cannot hide the content failure signal", async () => {
    const state = await runVerifier({ pullRequest: true, rejectComment: true })

    assert.equal(state.posts, 1)
    assert.match(state.evaluationError?.message || "", /comment endpoint unavailable/)
    assert.equal(state.failed.length, 1, "failure must be signalled before reporting")
    assert.equal(state.exitCode, 1)
})

test("successful pull-request reporting signals failure exactly once", async () => {
    const state = await runVerifier({ pullRequest: true })

    assert.equal(state.posts, 1)
    assert.equal(state.evaluationError, undefined)
    assert.equal(state.failed.length, 1)
    assert.equal(state.exitCode, 1)
})
