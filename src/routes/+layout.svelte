<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';

  let { children } = $props();
  const base = import.meta.env.VITE_BASE_PATH ?? '';

  onMount(() => {
    if (!base) return;

    const prefixInternalLinks = (root: ParentNode) => {
      root.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (href && !href.startsWith(base + '/') && href !== base) {
          anchor.setAttribute('href', base + href);
        }
      });
    };

    prefixInternalLinks(document);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches('a[href^="/"]')) {
              const href = node.getAttribute('href');
              if (href && !href.startsWith(base + '/') && href !== base) {
                node.setAttribute('href', base + href);
              }
            }
            prefixInternalLinks(node);
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  });
</script>

{@render children()}
