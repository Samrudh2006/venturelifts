import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

interface CommentThreadProps {
  ventureId: number;
}

function CommentItem({ comment, ventureId, onReply }: { comment: any; ventureId: number; onReply: () => void }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const deleteMutation = useMutation({
    mutationFn: () => api.comments.delete(comment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", ventureId] }),
  });

  const updateMutation = useMutation({
    mutationFn: (content: string) => api.comments.update(comment.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", ventureId] });
      setEditing(false);
    },
  });

  const canModify = user && (user.id === comment.userId || user.role === "admin");

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
            {comment.user.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-white">{comment.user.name}</span>
          <span className="text-xs text-gray-600">{comment.user.role}</span>
          <span className="text-xs text-gray-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>
        {canModify && (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(!editing); setEditContent(comment.content); }}
              className="text-xs text-gray-500 hover:text-orange-400">Edit</button>
            <button onClick={() => { if (confirm("Delete this comment?")) deleteMutation.mutate(); }}
              className="text-xs text-gray-500 hover:text-red-400">Delete</button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={2}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 p-2 text-sm outline-none focus:border-orange-500" />
          <div className="flex gap-2">
            <button onClick={() => updateMutation.mutate(editContent)}
              className="rounded bg-orange-600 px-3 py-1 text-xs font-bold text-white">Save</button>
            <button onClick={() => setEditing(false)}
              className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-400">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">{comment.content}</p>
      )}
      <button onClick={onReply} className="mt-2 text-xs text-gray-500 hover:text-orange-400">Reply</button>

      {comment.replies?.map((reply: any) => (
        <div key={reply.id} className="ml-6 mt-3 border-l-2 border-gray-800 pl-4">
          <CommentItem comment={reply} ventureId={ventureId} onReply={() => {}} />
        </div>
      ))}
    </div>
  );
}

export default function Comments({ ventureId }: CommentThreadProps) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", ventureId],
    queryFn: () => api.comments.list(ventureId),
  });

  const createMutation = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: number }) =>
      api.comments.create(ventureId, content, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", ventureId] });
      setNewComment("");
      setReplyTo(null);
    },
  });

  const comments = data?.comments || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate({ content: newComment, parentId: replyTo?.id });
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
        Comments ({comments.length})
      </h2>

      <form onSubmit={handleSubmit} className="mb-6">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
            <span>Replying to <strong className="text-orange-400">{replyTo.name}</strong></span>
            <button type="button" onClick={() => setReplyTo(null)}
              className="text-gray-600 hover:text-red-400">Cancel</button>
          </div>
        )}
        <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
          placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Add a comment..."}
          rows={2} maxLength={2000}
          className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
        <button type="submit" disabled={!newComment.trim() || createMutation.isPending}
          className="rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50">
          {createMutation.isPending ? "Posting..." : replyTo ? "Post Reply" : "Post Comment"}
        </button>
      </form>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 rounded-lg bg-gray-800" />)}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet. Be the first to share feedback.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment: any) => (
            <CommentItem key={comment.id} comment={comment} ventureId={ventureId}
              onReply={() => setReplyTo({ id: comment.id, name: comment.user.name })} />
          ))}
        </div>
      )}
    </div>
  );
}
