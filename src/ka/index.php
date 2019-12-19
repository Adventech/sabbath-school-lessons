<?php

include_once 'Helper.php';


class FileWriter {
    public $file;
    public $wDays= [];
    public $start;
    public $year;
    public $lessons;
    public $days = ["კვირადღე","ორშაბათი","სამშაბათი","ოთხშაბათი","ხუთშაბათი","პარასკევი"];
    public $quarter;
    public function __construct () {
       $this->file = file_get_contents('ss.txt');
       $this->start = new DateTime("2019-12-28"); // todo: date validation (after now?)
       preg_match_all("/გაკვეთილი \d+ {6}/",$this->file,$this->lessons);
       $this->file = preg_replace("/\{/","```",$this->file);
       $this->file = preg_replace("/\}/","```",$this->file);
       preg_match_all("/(კვირადღე [\W\dIVX]+)(ორშაბათი)/",$this->file,$this->wDays[1]);
       preg_match_all("/(ორშაბათი [\W\dIVX]+)(სამშაბათი)/",$this->file,$this->wDays[2]);
       preg_match_all("/(სამშაბათი [\W\dIVX]+)(ოთხშაბათი)/",$this->file,$this->wDays[3]);
       preg_match_all("/(ოთხშაბათი [\W\dIVX]+)(ხუთშაბათი)/",$this->file,$this->wDays[4]);
       preg_match_all("/(ხუთშაბათი [\W\dIVX]+)(პარასკევი)/",$this->file,$this->wDays[5]);
    }
    public function getContent() {
        echo $this->file;
    }
    public function getLessons() {
        return $this->lessons;
    }

    
}
$file = new FileWriter();
$arr = $file->getLessons() ;
Helper::clog($file->wDays[1][1][0]);


foreach ($arr[0] as $ind => $lesson){
    ++$ind;
    if ($ind < 10) { $ind = "0".$ind; }
    if (!is_dir("out")) { mkdir("out"); }
    if (!is_dir("out/".$ind)) { mkdir("out/".$ind); }
    $file->wDays[1][1][0]= preg_replace("/[ა-ჰ]+ +\d+ [ა-ჰ]+/", "---\ntitle:\ndata:\n---\n",$file->wDays[1][1][0]);
    $file->wDays[2][1][0]= preg_replace("/[ა-ჰ]+ +\d+ [ა-ჰ]+/", "---\ntitle:\ndata:\n---\n",$file->wDays[2][1][0]);
    $file->wDays[3][1][0]= preg_replace("/[ა-ჰ]+ +\d+ [ა-ჰ]+/", "---\ntitle:\ndata:\n---\n",$file->wDays[3][1][0]);
    $file->wDays[4][1][0]= preg_replace("/[ა-ჰ]+ +\d+ [ა-ჰ]+/", "---\ntitle:\ndata:\n---\n",$file->wDays[4][1][0]);
    $file->wDays[5][1][0]= preg_replace("/[ა-ჰ]+ +\d+ [ა-ჰ]+/", "---\ntitle:\ndata:\n---\n",$file->wDays[5][1][0]);
    Helper::clog($file->wDays[1][1][0],"rep:");


    file_put_contents("out/{$ind}/02.md",$file->wDays[1][1][0]);
    file_put_contents("out/{$ind}/03.md",$file->wDays[3][1][0]);
    file_put_contents("out/{$ind}/04.md",$file->wDays[4][1][0]);
    file_put_contents("out/{$ind}/05.md",$file->wDays[5][1][0]);
}



// read file
// parse weeks
// parse days
// create week folder
// create day files
