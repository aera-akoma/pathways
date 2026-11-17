<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectBookmark;
use App\Models\ProjectCategory;
use App\Models\ProjectComment;
use App\Models\ProjectImage;
use App\Models\ProjectLike;
use App\Models\ProjectNotification;
use App\Models\ProjectPost;
use App\Models\ProjectReport;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Helper to enrich project post with images, like/bookmark status, etc.
     */
    protected function enrichPost(ProjectPost $post, ?string $currentStudentId = null): array
    {
        $data = $post->toArray();
        $data['images'] = $post->images()->get()->toArray();
        $data['tags'] = is_array($post->tags) ? $post->tags : json_decode($post->tags ?: '[]', true);

        $isLiked = false;
        $isBookmarked = false;

        if ($currentStudentId) {
            $isLiked = ProjectLike::where('postId', $post->id)->where('studentId', $currentStudentId)->exists();
            $isBookmarked = ProjectBookmark::where('postId', $post->id)->where('studentId', $currentStudentId)->exists();
        }

        $data['isLiked'] = $isLiked;
        $data['isBookmarked'] = $isBookmarked;

        return $data;
    }

    /**
     * List project categories
     */
    public function categories(): JsonResponse
    {
        $categories = ProjectCategory::orderBy('orderIndex', 'asc')->get();
        return response()->json($categories);
    }

    /**
     * Store project category (Admin)
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $name = trim((string)$request->input('name'));
        if (!$name) {
            return response()->json(['error' => 'Category name is required.'], 422);
        }

        $id = (string)$request->input('id', 'cat-' . Str::slug($name));
        $category = ProjectCategory::create([
            'id' => $id,
            'name' => $name,
            'slug' => Str::slug($name),
            'icon' => $request->input('icon', 'Code'),
            'color' => $request->input('color', '#0d9488'),
            'orderIndex' => (int)$request->input('orderIndex', 0),
        ]);

        return response()->json($category, 201);
    }

    /**
     * Delete project category (Admin)
     */
    public function destroyCategory(string $id): JsonResponse
    {
        $category = ProjectCategory::find($id);
        if (!$category) {
            return response()->json(['error' => 'Category not found.'], 404);
        }

        $category->delete();
        return response()->json(['success' => true]);
    }

    /**
     * List project feed
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProjectPost::where('status', '!=', 'hidden');

        if ($category = $request->query('category')) {
            if ($category !== 'All') {
                $query->where('category', $category);
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('studentName', 'like', "%{$search}%");
            });
        }

        $auth = $request->attributes->get('auth');
        $currentStudentId = ($auth && $auth['role'] === 'student') ? $auth['id'] : $request->query('currentStudentId');

        $posts = $query->orderBy('createdAt', 'desc')->get();
        $enriched = $posts->map(fn($p) => $this->enrichPost($p, $currentStudentId));

        return response()->json($enriched);
    }

    /**
     * Store new project post
     */
    public function store(Request $request): JsonResponse
    {
        $title = trim((string)$request->input('title'));
        $description = trim((string)$request->input('description'));
        if (!$title || !$description) {
            return response()->json(['error' => 'Title and description are required.'], 422);
        }

        $auth = $request->attributes->get('auth');
        $studentId = $auth['id'] ?? $request->input('studentId');
        $studentName = $auth['name'] ?? $request->input('studentName', 'Student');
        $studentAvatar = $auth['student']['avatar'] ?? $request->input('studentAvatar');
        $studentCourse = $auth['student']['course'] ?? $request->input('studentCourse', 'BCA');
        $studentSemester = $auth['student']['semester'] ?? $request->input('studentSemester', 'V');

        $id = (string)$request->input('id', 'proj-' . Str::random(12));

        $tags = $request->input('tags', []);
        if (is_string($tags)) {
            $tags = json_decode($tags, true) ?: [];
        }

        $post = ProjectPost::create([
            'id' => $id,
            'studentId' => $studentId,
            'studentName' => $studentName,
            'studentAvatar' => $studentAvatar,
            'studentCourse' => $studentCourse,
            'studentSemester' => $studentSemester,
            'title' => $title,
            'description' => $description,
            'category' => $request->input('category', 'Web Development'),
            'demoUrl' => $request->input('demoUrl'),
            'githubUrl' => $request->input('githubUrl'),
            'youtubeUrl' => $request->input('youtubeUrl'),
            'tags' => $tags,
            'likesCount' => 0,
            'commentsCount' => 0,
            'status' => 'active',
        ]);

        // Save project images
        $images = $request->input('images', []);
        if (is_array($images)) {
            foreach ($images as $index => $img) {
                $imgUrl = is_array($img) ? ($img['imageUrl'] ?? '') : (string)$img;
                if ($imgUrl) {
                    ProjectImage::create([
                        'id' => 'img-' . Str::random(12),
                        'postId' => $id,
                        'imageUrl' => $imgUrl,
                        'caption' => is_array($img) ? ($img['caption'] ?? null) : null,
                        'orderIndex' => $index,
                    ]);
                }
            }
        }

        // Increment student project count
        $student = Student::find($studentId);
        if ($student) {
            $student->increment('projects');
        }

        return response()->json($this->enrichPost($post, $studentId), 201);
    }

    /**
     * Show project post details
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $post = ProjectPost::find($id);
        if (!$post) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        $auth = $request->attributes->get('auth');
        $currentStudentId = ($auth && $auth['role'] === 'student') ? $auth['id'] : $request->query('currentStudentId');

        $enriched = $this->enrichPost($post, $currentStudentId);
        $enriched['comments'] = $post->comments()->get();

        return response()->json($enriched);
    }

    /**
     * Update project post
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $post = ProjectPost::find($id);
        if (!$post) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        $data = $request->only(['title', 'description', 'category', 'demoUrl', 'githubUrl', 'youtubeUrl', 'tags']);
        if (isset($data['tags']) && is_string($data['tags'])) {
            $data['tags'] = json_decode($data['tags'], true) ?: [];
        }

        $post->update($data);
        return response()->json($this->enrichPost($post, $post->studentId));
    }

    /**
     * Delete project post
     */
    public function destroy(string $id): JsonResponse
    {
        $post = ProjectPost::find($id);
        if (!$post) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        $studentId = $post->studentId;
        $post->images()->delete();
        $post->likes()->delete();
        $post->bookmarks()->delete();
        $post->comments()->delete();
        $post->reports()->delete();
        $post->delete();

        $student = Student::find($studentId);
        if ($student && $student->projects > 0) {
            $student->decrement('projects');
        }

        return response()->json(['success' => true]);
    }

    /**
     * Toggle like on post
     */
    public function toggleLike(Request $request, string $id): JsonResponse
    {
        $post = ProjectPost::find($id);
        if (!$post) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        $auth = $request->attributes->get('auth');
        $studentId = ($auth && $auth['role'] === 'student') ? $auth['id'] : $request->input('studentId');

        if (!$studentId) {
            return response()->json(['error' => 'Student ID required.'], 422);
        }

        $existing = ProjectLike::where('postId', $id)->where('studentId', $studentId)->first();
        if ($existing) {
            $existing->delete();
            $post->decrement('likesCount');
            $liked = false;
        } else {
            ProjectLike::create([
                'id' => 'like-' . Str::random(12),
                'postId' => $id,
                'studentId' => $studentId,
            ]);
            $post->increment('likesCount');
            $liked = true;
        }

        return response()->json([
            'success' => true,
            'liked' => $liked,
            'likesCount' => $post->likesCount,
        ]);
    }

    /**
     * Toggle bookmark on post
     */
    public function toggleBookmark(Request $request, string $id): JsonResponse
    {
        $post = ProjectPost::find($id);
        if (!$post) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        $auth = $request->attributes->get('auth');
        $studentId = ($auth && $auth['role'] === 'student') ? $auth['id'] : $request->input('studentId');

        if (!$studentId) {
            return response()->json(['error' => 'Student ID required.'], 422);
        }

        $existing = ProjectBookmark::where('postId', $id)->where('studentId', $studentId)->first();
        if ($existing) {
            $existing->delete();
            $bookmarked = false;
        } else {
            ProjectBookmark::create([
                'id' => 'bm-' . Str::random(12),
                'postId' => $id,
                'studentId' => $studentId,
            ]);
            $bookmarked = true;
        }

        return response()->json([
            'success' => true,
            'bookmarked' => $bookmarked,
        ]);
    }

    /**
     * Get comments for post
     */
    public function comments(string $id): JsonResponse
    {
        $comments = ProjectComment::where('postId', $id)->orderBy('createdAt', 'asc')->get();
        return response()->json($comments);
    }

    /**
     * Store comment on post
     */
    public function storeComment(Request $request, string $id): JsonResponse
    {
        $post = ProjectPost::find($id);
        if (!$post) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        $content = trim((string)$request->input('content'));
        if (!$content) {
            return response()->json(['error' => 'Comment content is required.'], 422);
        }

        $auth = $request->attributes->get('auth');
        $studentId = $auth['id'] ?? $request->input('studentId');
        $studentName = $auth['name'] ?? $request->input('studentName', 'Student');
        $studentAvatar = $auth['student']['avatar'] ?? $request->input('studentAvatar');

        $comment = ProjectComment::create([
            'id' => 'cmt-' . Str::random(12),
            'postId' => $id,
            'parentId' => $request->input('parentId'),
            'studentId' => $studentId,
            'studentName' => $studentName,
            'studentAvatar' => $studentAvatar,
            'content' => $content,
        ]);

        $post->increment('commentsCount');

        return response()->json($comment, 201);
    }

    /**
     * Delete comment
     */
    public function destroyComment(string $id): JsonResponse
    {
        $comment = ProjectComment::find($id);
        if (!$comment) {
            return response()->json(['error' => 'Comment not found.'], 404);
        }

        $post = ProjectPost::find($comment->postId);
        $comment->delete();

        if ($post && $post->commentsCount > 0) {
            $post->decrement('commentsCount');
        }

        return response()->json(['success' => true]);
    }

    /**
     * Report project post
     */
    public function report(Request $request, string $id): JsonResponse
    {
        $post = ProjectPost::find($id);
        if (!$post) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        $reason = trim((string)$request->input('reason'));
        if (!$reason) {
            return response()->json(['error' => 'Report reason is required.'], 422);
        }

        $auth = $request->attributes->get('auth');
        $reporterId = $auth['id'] ?? $request->input('reporterId', 'anonymous');
        $reporterName = $auth['name'] ?? $request->input('reporterName', 'Student');

        ProjectReport::create([
            'id' => 'rep-' . Str::random(12),
            'postId' => $id,
            'reporterId' => $reporterId,
            'reporterName' => $reporterName,
            'reason' => $reason,
            'details' => $request->input('details'),
            'status' => 'pending',
        ]);

        return response()->json(['success' => true, 'message' => 'Report submitted for administrator review.']);
    }

    /**
     * Admin view project reports
     */
    public function adminReports(): JsonResponse
    {
        $reports = ProjectReport::with('post')->orderBy('createdAt', 'desc')->get();
        return response()->json($reports);
    }

    /**
     * Admin dismiss project report
     */
    public function destroyReport(string $id): JsonResponse
    {
        $report = ProjectReport::find($id);
        if (!$report) {
            return response()->json(['error' => 'Report not found.'], 404);
        }

        $report->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Admin project statistics
     */
    public function adminStats(): JsonResponse
    {
        return response()->json([
            'totalPosts' => ProjectPost::count(),
            'totalLikes' => ProjectLike::count(),
            'totalComments' => ProjectComment::count(),
            'totalReports' => ProjectReport::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Student project notifications
     */
    public function notifications(Request $request): JsonResponse
    {
        $auth = $request->attributes->get('auth');
        $studentId = $auth['id'] ?? $request->query('studentId');

        $notifications = ProjectNotification::where('studentId', $studentId)
            ->orderBy('createdAt', 'desc')
            ->get();

        return response()->json($notifications);
    }

    /**
     * Mark project notifications as read
     */
    public function markNotificationsRead(Request $request): JsonResponse
    {
        $auth = $request->attributes->get('auth');
        $studentId = $auth['id'] ?? $request->input('studentId');

        ProjectNotification::where('studentId', $studentId)->update(['isRead' => 1]);
        return response()->json(['success' => true]);
    }
}
