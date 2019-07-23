// package main

// import (
// 	"fmt"
// 	"unicode"
// )

// var combining = &unicode.RangeTable{
// 	R16: []unicode.Range16{
// 		{0x0300, 0x036f, 1}, // combining diacritical marks
// 		{0x1ab0, 0x1aff, 1}, // combining diacritical marks extended
// 		{0x1dc0, 0x1dff, 1}, // combining diacritical marks supplement
// 		{0x20d0, 0x20ff, 1}, // combining diacritical marks for symbols
// 		{0xfe20, 0xfe2f, 1}, // combining half marks
// 	},
// }

// func reverse(s string) string {
// 	sv := []rune(s)
// 	rv := make([]rune, 0, len(sv))
// 	cv := make([]rune, 0)
// 	for ix := len(sv) - 1; ix >= 0; ix-- {
// 		r := sv[ix]
// 		if unicode.In(r, combining) {
// 			cv = append(cv, r)
// 		} else {
// 			rv = append(rv, r)
// 			rv = append(rv, cv...)
// 			cv = make([]rune, 0)
// 		}
// 	}
// 	return string(rv)
// }
// func main() {
// 	fmt.Println(reverse("\"הֶזַּה םָלוֹעָל וּמַּדִּתּ־לַא\""))
// }

package main 
import "fmt"
func main() { 
        input := "פ ךא ,\"הֶזַּה םָלוֹעָל וּמַּדִּתּ־לַא\" םיה"
        // Get Unicode code points. 
        n := 0
        rune := make([]rune, len(input))
        for _, r := range input { 
                rune[n] = r
                n++
        } 
        rune = rune[0:n]
        // Reverse 
        for i := 0; i < n/2; i++ { 
                rune[i], rune[n-1-i] = rune[n-1-i], rune[i] 
        } 
        // Convert back to UTF-8. 
        output := string(rune)
        fmt.Println(output)
}