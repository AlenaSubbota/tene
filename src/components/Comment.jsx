import React from 'react';
import { HeartIcon, SendIcon } from './icons';

export const groupComments = (commentsList) => {
    const commentMap = {};
    const topLevelComments = [];

    commentsList.forEach(comment => {
        comment.replies = [];
        commentMap[comment.id] = comment;
        if (comment.parentId) {
            if (commentMap[comment.parentId]) {
                commentMap[comment.parentId].replies.push(comment);
            }
        } else {
            topLevelComments.push(comment);
        }
    });

    return topLevelComments;
};

export const Comment = React.memo(({ comment, onReply, onLike, onEdit, onDelete, onUpdate, isUserAdmin, currentUserId, editingCommentId, editingText, setEditingText, replyingTo, replyText, setReplyText, onCommentSubmit, isLiked }) => {
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingTo === comment.id;
    const canModify = isUserAdmin || currentUserId === comment.userId;
    
    return (
        <div className="flex flex-col">
            <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-border-color flex-shrink-0"></div>
                <div className="flex-1">
                    <p className="font-semibold text-sm">{comment.userName}</p>
                    {isEditing ? (
                        <input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full p-1 bg-background border border-border-color rounded"/>
                    ) : (
                        <p className="text-sm opacity-90">{comment.text}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-1 text-xs opacity-70">
                        <button onClick={onLike} className={`flex items-center space-x-1 ${isLiked ? 'text-accent' : ''}`}>
                            <HeartIcon filled={isLiked} width="16" height="16" />
                            <span>{comment.likes}</span>
                        </button>
                        <button onClick={() => onReply(comment.id)}>Ответить</button>
                        {canModify && (
                            <>
                                {isEditing ? (
                                    <button onClick={() => onUpdate(comment.id, editingText)}>Сохранить</button>
                                ) : (
                                    <button onClick={() => onEdit(comment.id, comment.text)}>Изменить</button>
                                )}
                                <button onClick={onDelete}>Удалить</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {isReplying && (
                <div className="ml-11 mt-2 flex items-center gap-2">
                    <input value={replyText} onChange={(e) => setReplyText(e.target.value)} type="text" placeholder={`Ответ ${comment.userName}...`} className="w-full p-2 text-sm bg-background border border-border-color rounded-lg focus:outline-none focus:ring-1 focus:ring-accent" />
                    <button onClick={() => onCommentSubmit(replyText, comment.id)} className="p-2 rounded-full bg-accent text-white"><SendIcon width="20" height="20" /></button>
                </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
                 <div className="ml-11 mt-3 space-y-3 pl-3 border-l-2 border-border-color">
                     {comment.replies.map(reply => (
                         <Comment
                            key={reply.id}
                            comment={reply}
                            onLike={() => onLike(reply.id)} // Placeholder, needs wiring up
                            onDelete={() => onDelete(reply.id)} // Placeholder
                            onEdit={() => onEdit(reply.id, reply.text)} // Placeholder
                            onUpdate={onUpdate} // Placeholder
                            onReply={onReply}
                            isUserAdmin={isUserAdmin}
                            currentUserId={currentUserId}
                            editingCommentId={editingCommentId}
                            editingText={editingText}
                            setEditingText={setEditingText}
                            replyingTo={replyingTo}
                            replyText={replyText}
                            setReplyText={setReplyText}
                            onCommentSubmit={onCommentSubmit}
                            isLiked={false} // Placeholder
                         />
                     ))}
                 </div>
            )}
        </div>
    );
});