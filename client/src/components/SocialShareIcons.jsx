import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { buildShareLinks, copyPageLink, openShareWindow } from '../lib/socialShare.js';

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 22v-8h2.7l.4-3.1H13.5V9.1c0-.9.2-1.5 1.5-1.5h1.6V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.4v3.1h2.5v8h3.6Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18 5 12 5 12 5s-6 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 9 2 12 2 12s0 3 .4 4.8a2.5 2.5 0 0 0 1.8 1.8C6 19 12 19 12 19s6 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.8.4-4.8.4-4.8s0-3-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.3 3H20l-6.4 7.3L21 21h-5.5l-4.3-5.6-4.9 5.6H3.8l6.8-7.8L3 3h5.6l3.9 5.1L17.3 3Zm-1.9 16.2h1.5L7.8 4.7H6.2l9.2 14.5Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 3.5A4.5 4.5 0 1 1 7.5 13 4.5 4.5 0 0 1 12 8.5Zm0 2A2.5 2.5 0 1 0 14.5 13 2.5 2.5 0 0 0 12 10.5ZM17.8 7.2a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0-3.2 17.4c-.1-.8-.2-2 .1-3l1.2-4.9s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.6 2 1.7 2 2 0 3.5-2.1 3.5-5.2 0-2.7-1.9-4.6-4.7-4.6a5.2 5.2 0 0 0-5.4 5.3c0 1 .4 1.7.9 2.2.1.1.1.2.1.3l-.3 1.3c0 .2-.2.3-.4.2-1.5-.7-2.4-2.8-2.4-4.5 0-3.7 2.7-7 7.8-7 4.1 0 7.3 2.9 7.3 7.2 0 4.1-2.6 7.4-6.2 7.4-1.2 0-2.3-.6-2.7-1.4l-.7 2.8c-.3 1-.9 2-1.4 2.7A9 9 0 1 0 12 3Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.5 8.7H3.6V21h2.9V8.7ZM5 3a1.7 1.7 0 1 0 0 3.4A1.7 1.7 0 0 0 5 3ZM9.2 8.7H12v1.7h.1c.4-.7 1.3-1.5 2.7-1.5 2.9 0 3.4 1.9 3.4 4.4V21h-3v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9.2V8.7Z" />
    </svg>
  );
}

const SHARE_ACTIONS = [
  {
    id: 'facebook',
    label: 'Share this page on Facebook',
    Icon: FacebookIcon,
    type: 'window',
    key: 'facebook',
  },
  {
    id: 'twitter',
    label: 'Share this page on X (Twitter)',
    Icon: XIcon,
    type: 'window',
    key: 'twitter',
  },
  {
    id: 'instagram',
    label: 'Copy link to share on Instagram',
    Icon: InstagramIcon,
    type: 'copy',
  },
  {
    id: 'youtube',
    label: 'Copy link to share on YouTube',
    Icon: YouTubeIcon,
    type: 'copy',
  },
  {
    id: 'pinterest',
    label: 'Share this page on Pinterest',
    Icon: PinterestIcon,
    type: 'window',
    key: 'pinterest',
  },
  {
    id: 'linkedin',
    label: 'Share this page on LinkedIn',
    Icon: LinkedInIcon,
    type: 'window',
    key: 'linkedin',
  },
];

export default function SocialShareIcons({ className = '' }) {
  const location = useLocation();
  const [copiedId, setCopiedId] = useState(null);

  const { pageUrl, pageTitle, links } = useMemo(() => {
    const pageUrl = `${window.location.origin}${location.pathname}${location.search}`;
    const pageTitle = document.title || 'Bear River Quilting';
    return {
      pageUrl,
      pageTitle,
      links: buildShareLinks(pageUrl, pageTitle),
    };
  }, [location.pathname, location.search]);

  const handleAction = useCallback(
    async (action) => {
      if (action.type === 'copy') {
        await copyPageLink(pageUrl);
        setCopiedId(action.id);
        window.setTimeout(() => setCopiedId((current) => (current === action.id ? null : current)), 2000);
        return;
      }

      const href = links[action.key];
      if (href) openShareWindow(href);
    },
    [links, pageUrl]
  );

  return (
    <nav
      className={`social-share-icons${className ? ` ${className}` : ''}`}
      aria-label="Share this page"
    >
      <ul className="social-share-icons__list">
        {SHARE_ACTIONS.map((action) => {
          const { Icon } = action;
          const copied = copiedId === action.id;
          const label = copied ? 'Link copied' : action.label;

          return (
            <li key={action.id}>
              <button
                type="button"
                className={`social-share-icons__btn social-share-icons__btn--${action.id}${copied ? ' is-copied' : ''}`}
                aria-label={label}
                title={label}
                onClick={() => handleAction(action)}
              >
                <Icon />
              </button>
            </li>
          );
        })}
      </ul>
      <span className="visually-hidden" aria-live="polite">
        {copiedId ? 'Page link copied to clipboard' : ''}
      </span>
    </nav>
  );
}
