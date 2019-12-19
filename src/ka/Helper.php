<?php


class Helper
{

    public static function json( $data ){
        return json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    }

    public static function dump($data) {
        echo "<pre>";
        print_r($data);
        echo "</pre>";
    }

    public static function dd($data) {
        self::dump($data); die;
    }

    public static function clog( $data, $info="PHP: " ){
        echo '<script>';
        echo "console.log( '{$info}',". self::json($data) .')';
        echo '</script>';
    }
}