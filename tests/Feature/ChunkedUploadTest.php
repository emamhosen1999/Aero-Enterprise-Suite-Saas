<?php

namespace Tests\Feature;

use App\Services\ChunkedUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ChunkedUploadTest extends TestCase
{
    protected ChunkedUploadService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ChunkedUploadService;
        Storage::fake('local');
    }

    public function test_can_initialize_upload(): void
    {
        $result = $this->service->initializeUpload(
            'test-file.pdf',
            1024 * 1024 * 10, // 10MB
            10,
            ['user_id' => 1]
        );

        $this->assertArrayHasKey('upload_id', $result);
        $this->assertArrayHasKey('chunk_size', $result);
        $this->assertArrayHasKey('expires_at', $result);
        $this->assertNotEmpty($result['upload_id']);
    }

    public function test_can_upload_chunk(): void
    {
        // Initialize upload
        $initResult = $this->service->initializeUpload(
            'test-file.txt',
            1024 * 3, // 3KB total
            3,
            []
        );

        $uploadId = $initResult['upload_id'];

        // Upload first chunk
        $chunk = UploadedFile::fake()->create('chunk_0', 1); // 1KB
        $result = $this->service->uploadChunk($uploadId, 0, $chunk);

        $this->assertEquals('uploaded', $result['status']);
        $this->assertEquals(0, $result['chunk_index']);
        $this->assertEquals(1, $result['uploaded_chunks']);
        $this->assertEquals(3, $result['total_chunks']);
        $this->assertFalse($result['ready_to_assemble']);
    }

    public function test_chunk_upload_is_idempotent(): void
    {
        $initResult = $this->service->initializeUpload(
            'test-file.txt',
            1024,
            1,
            []
        );

        $uploadId = $initResult['upload_id'];

        $chunk = UploadedFile::fake()->create('chunk_0', 1);

        // Upload same chunk twice
        $this->service->uploadChunk($uploadId, 0, $chunk);
        $result = $this->service->uploadChunk($uploadId, 0, $chunk);

        $this->assertEquals('already_uploaded', $result['status']);
    }

    public function test_can_get_upload_status(): void
    {
        $initResult = $this->service->initializeUpload(
            'test-file.txt',
            1024 * 2,
            2,
            []
        );

        $uploadId = $initResult['upload_id'];

        // Upload one chunk
        $chunk = UploadedFile::fake()->create('chunk_0', 1);
        $this->service->uploadChunk($uploadId, 0, $chunk);

        // Get status
        $status = $this->service->getUploadStatus($uploadId);

        $this->assertNotNull($status);
        $this->assertEquals($uploadId, $status['upload_id']);
        $this->assertEquals('uploading', $status['status']);
        $this->assertEquals(50, $status['progress']);
        $this->assertEquals(1, $status['uploaded_chunks']);
        $this->assertEquals([1], $status['missing_chunks']);
    }

    public function test_can_cancel_upload(): void
    {
        $initResult = $this->service->initializeUpload(
            'test-file.txt',
            1024,
            1,
            []
        );

        $uploadId = $initResult['upload_id'];

        $result = $this->service->cancelUpload($uploadId);

        $this->assertTrue($result);
        $this->assertNull($this->service->getUploadStatus($uploadId));
    }

    public function test_resume_returns_missing_chunks(): void
    {
        $initResult = $this->service->initializeUpload(
            'test-file.txt',
            1024 * 3,
            3,
            []
        );

        $uploadId = $initResult['upload_id'];

        // Upload only first and last chunks
        $chunk0 = UploadedFile::fake()->create('chunk_0', 1);
        $chunk2 = UploadedFile::fake()->create('chunk_2', 1);
        $this->service->uploadChunk($uploadId, 0, $chunk0);
        $this->service->uploadChunk($uploadId, 2, $chunk2);

        $result = $this->service->resumeUpload($uploadId);

        $this->assertEquals('resumable', $result['status']);
        $this->assertEquals([1], $result['missing_chunks']); // Only chunk 1 is missing
    }

    public function test_invalid_chunk_index_throws_exception(): void
    {
        $initResult = $this->service->initializeUpload(
            'test-file.txt',
            1024,
            2,
            []
        );

        $uploadId = $initResult['upload_id'];
        $chunk = UploadedFile::fake()->create('chunk', 1);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid chunk index');

        $this->service->uploadChunk($uploadId, 5, $chunk);
    }

    public function test_upload_not_found_throws_exception(): void
    {
        $chunk = UploadedFile::fake()->create('chunk', 1);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Upload session not found');

        $this->service->uploadChunk('non-existent-id', 0, $chunk);
    }

    public function test_recommended_chunk_size_scales_with_file_size(): void
    {
        // Small file (10MB) - 1MB chunks
        $result1 = $this->service->initializeUpload('small.pdf', 10 * 1024 * 1024, 10, []);
        $this->assertEquals(1024 * 1024, $result1['chunk_size']);

        // Medium file (100MB) - 2MB chunks
        $result2 = $this->service->initializeUpload('medium.pdf', 100 * 1024 * 1024, 50, []);
        $this->assertEquals(2 * 1024 * 1024, $result2['chunk_size']);

        // Large file (500MB) - 5MB chunks
        $result3 = $this->service->initializeUpload('large.pdf', 500 * 1024 * 1024, 100, []);
        $this->assertEquals(5 * 1024 * 1024, $result3['chunk_size']);
    }

    protected function tearDown(): void
    {
        // Clean up any cached upload data
        Cache::flush();
        parent::tearDown();
    }
}
