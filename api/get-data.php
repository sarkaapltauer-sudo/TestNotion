<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Pro lokální vývoj

$cacheFile = __DIR__ . '/../_private/notion_cache.json';
$cacheTime = 600; // 10 minut v sekundách

$configFile = __DIR__ . '/../_private/notion-config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Chybí konfigurační soubor.']);
    exit;
}
require $configFile;

$token = $notionConfig['token'];
$databaseId = $notionConfig['database_id'];

// Pokud je cache platná a soubor existuje, rovnou vrátíme data
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTime)) {
    echo file_get_contents($cacheFile);
    exit;
}

// Stahování dat z Notion API
$url = "https://api.notion.com/v1/databases/{$databaseId}/query";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer {$token}",
    "Notion-Version: 2022-06-28",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "sorts" => [
        [
            "property" => "Date", // Lze změnit dle reálného sloupce
            "direction" => "descending"
        ]
    ]
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Chyba při komunikaci s Notion API.',
        'details' => json_decode($response)
    ]);
    exit;
}

$data = json_decode($response, true);
$results = [];

if (isset($data['results'])) {
    foreach ($data['results'] as $page) {
        $props = $page['properties'];
        
        $title = '';
        if (isset($props['Text 1']['title'][0]['plain_text'])) {
            $title = $props['Text 1']['title'][0]['plain_text'];
        } elseif (isset($props['Text 1']['rich_text'][0]['plain_text'])) {
            $title = $props['Text 1']['rich_text'][0]['plain_text'];
        } elseif (isset($props['Name']['title'][0]['plain_text'])) {
            $title = $props['Name']['title'][0]['plain_text'];
        }

        $dateValue = '';
        if (isset($props['Date']['date']['start'])) {
            $dateValue = $props['Date']['date']['start'];
        }

        $description = '';
        if (isset($props['Test notion']['rich_text'][0]['plain_text'])) {
            $description = $props['Test notion']['rich_text'][0]['plain_text'];
        } elseif (isset($props['Description']['rich_text'][0]['plain_text'])) {
            $description = $props['Description']['rich_text'][0]['plain_text'];
        } elseif (isset($props['Popis']['rich_text'][0]['plain_text'])) {
            $description = $props['Popis']['rich_text'][0]['plain_text'];
        }

        // Přidáme pouze neprázdné záznamy
        if (!empty($title) || !empty($dateValue)) {
            $results[] = [
                'id' => $page['id'],
                'title' => $title,
                'description' => $description,
                'date' => $dateValue
            ];
        }
    }
}

$outputData = json_encode(['data' => $results], JSON_UNESCAPED_UNICODE);

// Uložení do cache
if ($outputData && $httpCode === 200) {
    file_put_contents($cacheFile, $outputData);
}

echo $outputData;
