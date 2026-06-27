import { createApp } from "vue";
import App from "./App.vue";
import router from "./router.js";
import "./styles.css";

const umamiSrc = import.meta.env.VITE_UMAMI_SRC;
const umamiId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
if (umamiSrc && umamiId) {
  const s = document.createElement("script");
  s.async = true;
  s.src = umamiSrc;
  s.setAttribute("data-website-id", umamiId);
  document.head.appendChild(s);
}

createApp(App).use(router).mount("#app");
