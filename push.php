<?php
require 'vendor/autoload.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// VAPID გასაღებები
$publicKey = "BJmZAK_JrJQgpW5OrqCnkx16n52dkmTPDmLvPRyTIYets7GhHMAK-ehh51_m2O4oh8JNQNFlY8ENFd-HVXUKYTU";
$privateKey = "S-GuVsKG4b9aOnDDxVDl-rKgs263NkILmaXWFIPrT-I";

$auth = [
    'VAPID' => [
        'subject' => 'mailto:example@example.com',
        'publicKey' => $publicKey,
        'privateKey' => $privateKey,
    ],
];

// გამოწერების ჩამოტვირთვა
$subscriptions = json_decode(file_get_contents("subscriptions.json"), true);
if (!$subscriptions || !isset($subscriptions['endpoint'])) {
    die("❌ No subscriptions found.");
}

// GitHub Actions-დან გარემოს ცვლადების მიღება
$lastCommitMessage = getenv('LAST_COMMIT_MESSAGE');
$lastCommitFile = getenv('LAST_COMMIT_FILE');
$commitUrl = getenv('COMMIT_URL');

$payload = json_encode([
    "title" => "🆕 ფაილი განახლდა!",
    "body" => "შეცვლილი ფაილი: $lastCommitFile\n$lastCommitMessage",
    "data" => ["url" => $commitUrl]
]);

$webPush = new WebPush($auth);
$webPush->sendNotification(
    Subscription::create($subscriptions),
    $payload
);

foreach ($webPush->flush() as $report) {
    if ($report->isSuccess()) {
        echo "✅ Push შეტყობინება გაგზავნილია!";
    } else {
        echo "❌ Push შეცდომა: " . $report->getReason();
    }
}
?>
