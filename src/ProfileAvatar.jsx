import React, { useState } from 'react';
import { hasUploadedAvatar, initialsAvatar } from './avatarUtils.js';
export function ProfileAvatar({ src, name, alt, className, style, onError, ...props }) {
  const [failedSource, setFailedSource] = useState(null);
  const label = name || alt || 'User';
  const fallback = initialsAvatar(label);
  const image = hasUploadedAvatar(src) && failedSource !== src ? src : fallback;
  return <img {...props} src={image} alt={alt || `${label} profile`} className={className} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit',display:'block',...style}} onError={() => { if (image !== fallback) setFailedSource(src); }} />;
}
export default ProfileAvatar;
