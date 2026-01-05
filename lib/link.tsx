// Shim for next/link - uses hash-based routing for Vite
import React from 'react';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export default function Link({ href, children, className, ...props }: LinkProps) {
  const finalHref = href.startsWith('/') ? '#' + href : href;
  return (
    <a href={finalHref} className={className} {...props}>
      {children}
    </a>
  );
}
