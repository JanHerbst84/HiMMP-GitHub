<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This maintenance command is CLI-only.\n");
    exit(2);
}

$storage_dir = $argv[1] ?? '/var/www/himmp-site/php/contact_submissions';
$retention_seconds = filter_var($argv[2] ?? '7200', FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1],
]);

if ($retention_seconds === false || !is_dir($storage_dir)) {
    fwrite(STDERR, "Usage: cleanup-contact-rate-limits.php <storage-directory> <retention-seconds>\n");
    exit(2);
}

$job_lock_file = $storage_dir . '/.rate_limit_cleanup_job.lock';
$job_lock_handle = @fopen($job_lock_file, 'c');
if ($job_lock_handle === false || !chmod($job_lock_file, 0600)) {
    if (is_resource($job_lock_handle)) {
        fclose($job_lock_handle);
    }
    fwrite(STDERR, "Rate-limit cleanup job lock could not be secured.\n");
    exit(1);
}

if (!flock($job_lock_handle, LOCK_EX | LOCK_NB)) {
    fclose($job_lock_handle);
    fwrite(STDOUT, "Rate-limit cleanup skipped: another collector is active.\n");
    exit(0);
}

$maintenance_lock_file = $storage_dir . '/.rate_limit_cleanup.lock';
$maintenance_handle = @fopen($maintenance_lock_file, 'c');
if ($maintenance_handle === false || !chmod($maintenance_lock_file, 0600)) {
    if (is_resource($maintenance_handle)) {
        fclose($maintenance_handle);
    }
    flock($job_lock_handle, LOCK_UN);
    fclose($job_lock_handle);
    fwrite(STDERR, "Rate-limit maintenance lock could not be secured.\n");
    exit(1);
}

$cutoff = time() - $retention_seconds;
$examined = 0;
$deleted = 0;
$deferred = 0;
$failed = 0;

try {
    $entries = new FilesystemIterator($storage_dir, FilesystemIterator::SKIP_DOTS);
    foreach ($entries as $entry) {
        $filename = $entry->getFilename();
        if ($entry->isLink() || !$entry->isFile() || !preg_match('/^rate_limit_[0-9a-f]{32}\.json$/', $filename)) {
            continue;
        }

        $examined++;
        $modified = @filemtime($entry->getPathname());
        if ($modified !== false && $modified <= $cutoff) {
            if (!flock($maintenance_handle, LOCK_EX | LOCK_NB)) {
                $deferred++;
                continue;
            }

            try {
                $candidate = $entry->getPathname();
                clearstatcache(true, $candidate);
                $locked_modified = @filemtime($candidate);
                if (
                    !is_link($candidate)
                    && is_file($candidate)
                    && $locked_modified !== false
                    && $locked_modified <= $cutoff
                ) {
                    if (@unlink($candidate)) {
                        $deleted++;
                    } else {
                        $failed++;
                    }
                }
            } finally {
                flock($maintenance_handle, LOCK_UN);
            }
        }
    }
} catch (UnexpectedValueException $exception) {
    fwrite(STDERR, "Rate-limit state could not be enumerated.\n");
    $failed++;
} finally {
    fclose($maintenance_handle);
    flock($job_lock_handle, LOCK_UN);
    fclose($job_lock_handle);
}

fwrite(STDOUT, "Rate-limit cleanup: examined={$examined} deleted={$deleted} deferred={$deferred} failed={$failed}\n");
exit($failed === 0 ? 0 : 1);
