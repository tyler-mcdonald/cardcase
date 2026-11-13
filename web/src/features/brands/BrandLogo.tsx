import { useState, type ReactNode } from "react";
import classes from "./BrandLogo.module.css";
import { brandLogoUrl } from "./logo-url";

type BrandLogoProps = {
  domain: string;
  size: number;
  fallback?: ReactNode;
  className?: string;
};

export function BrandLogo(props: BrandLogoProps) {
  return <BrandLogoImage key={props.domain} {...props} />;
}

function BrandLogoImage({ domain, size, fallback, className }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      fallback ?? (
        <span
          aria-hidden
          data-testid="brand-logo-placeholder"
          className={classes.placeholder}
          style={{ width: size, height: size }}
        />
      )
    );
  }

  return (
    <img
      src={brandLogoUrl(domain)}
      alt=""
      loading="lazy"
      width={size}
      height={size}
      className={className ? `${classes.logo} ${className}` : classes.logo}
      data-loaded={loaded || undefined}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}
