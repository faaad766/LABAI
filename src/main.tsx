import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import "./index.css";

Sentry.init({
  dsn: import.meta.env['VITE_SENTRY_DSN'] as string | undefined,
  environment: import.meta.env.MODE,
});

function getAnonymousVisitorId(): string {
  const key = 'labai_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'anon-' + crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

pendo.initialize({
  visitor: {
    id: getAnonymousVisitorId()
  }
});

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<p>应用发生错误，请刷新页面重试</p>}>
    <AppWrapper>
      <App />
    </AppWrapper>
  </Sentry.ErrorBoundary>
);
