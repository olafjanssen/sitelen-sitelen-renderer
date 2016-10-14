<?php
/**
 * Created by IntelliJ IDEA.
 * User: olafjanssen
 * Date: 13/10/2016
 * Time: 20:16
 */
//header('Access-Control-Allow-Origin: *');
//
$data = 'data:image/png;base64,' . $_POST['sitelen'];

$binary = file_get_contents($data);
$filename = 'uploads/' . uniqid() . '.png';

file_put_contents($filename, $binary);

echo json_encode($filename);


