import { createRouter, createWebHistory } from "vue-router";
import Landing from "./pages/Landing.vue";
import Login from "./pages/Login.vue";
import Register from "./pages/Register.vue";
import Dashboard from "./pages/Dashboard.vue";
import Players from "./pages/Players.vue";
import Fees from "./pages/Fees.vue";
import Rankings from "./pages/Rankings.vue";
import PublicPlayer from "./pages/PublicPlayer.vue";
import PublicFees from "./pages/PublicFees.vue";
import PublicBoard from "./pages/PublicBoard.vue";
import PublicQueue from "./pages/PublicQueue.vue";
import JoinSession from "./pages/JoinSession.vue";
import Tournament from "./pages/Tournament.vue";
import Pairing from "./pages/Pairing.vue";
import Teams from "./pages/Teams.vue";
import Groups from "./pages/Groups.vue";
import GroupDetail from "./pages/GroupDetail.vue";
import JoinGroup from "./pages/JoinGroup.vue";
import TeamDetail from "./pages/TeamDetail.vue";
import Profile from "./pages/Profile.vue";
import ManageSessions from "./pages/ManageSessions.vue";
import AcceptInvite from "./pages/AcceptInvite.vue";
import CheckEmail from "./pages/CheckEmail.vue";
import VerifyEmail from "./pages/VerifyEmail.vue";
import ForgotPassword from "./pages/ForgotPassword.vue";
import ResetPassword from "./pages/ResetPassword.vue";

const routes = [
  { path: "/landing", component: Landing, meta: { public: true, hideHeader: true, landing: true } },
  { path: "/welcome", redirect: "/landing" },
  { path: "/login", component: Login, meta: { public: true, hideHeader: true, auth: true } },
  { path: "/register", component: Register, meta: { public: true, hideHeader: true, auth: true } },
  { path: "/p/:token", component: PublicPlayer, meta: { public: true } },
  { path: "/fees/:token", component: PublicFees, meta: { public: true, hideHeader: true } },
  { path: "/q/:token", component: PublicQueue, meta: { public: true, hideHeader: true } },
  { path: "/join/:token", component: JoinSession, meta: { public: true } },
  { path: "/g/:token", component: JoinGroup, meta: { public: true } },
  { path: "/board/:sessionId", component: PublicBoard, meta: { public: true } },
  { path: "/check-email", component: CheckEmail, meta: { public: true } },
  { path: "/verify", component: VerifyEmail, meta: { public: true } },
  { path: "/forgot-password", component: ForgotPassword, meta: { public: true, hideHeader: true, auth: true } },
  { path: "/reset-password", component: ResetPassword, meta: { public: true } },
  { path: "/", component: Dashboard },
  { path: "/players", component: Players },
  { path: "/rankings", component: Rankings },
  { path: "/tournament", component: Tournament },
  { path: "/pairing", component: Pairing },
  { path: "/team-builder", redirect: "/pairing" },
  { path: "/teams", component: Teams, meta: { depth: 1 } },
  { path: "/teams/:id", component: TeamDetail, meta: { depth: 2 } },
  { path: "/groups", component: Groups, meta: { depth: 1 } },
  { path: "/groups/:id", component: GroupDetail, meta: { depth: 2 } },
  { path: "/fees", component: Fees },
  { path: "/profile", component: Profile },
  { path: "/sessions", component: ManageSessions },
  { path: "/invite/:token", component: AcceptInvite, meta: { public: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  if (to.meta.public) return true;
  const token = localStorage.getItem("token");
  if (!token) {
    if (to.path === "/") {
      return "/landing";
    }
    // Preserve where the user was headed so we can return after login.
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;
