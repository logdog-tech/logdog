import { computed, ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';
import router from '@/router';

const pendingRoute = ref<RouteLocationNormalized | null>(null);
const showConfirm = ref(false);
const blockingNavigation = ref(false);

export function shouldConfirmRouteChange(to: RouteLocationNormalized) {
  if (blockingNavigation.value) return false;
  return to.name !== 'home';
}

export function requestRouteConfirmation(to: RouteLocationNormalized) {
  pendingRoute.value = to;
  showConfirm.value = true;
}

export function acceptRouteChange() {
  if (!pendingRoute.value) return;
  const target = pendingRoute.value;
  pendingRoute.value = null;
  showConfirm.value = false;
  blockingNavigation.value = true;
  router.push(target).finally(() => {
    blockingNavigation.value = false;
  });
}

export function cancelRouteChange() {
  pendingRoute.value = null;
  showConfirm.value = false;
}

export function useNavigationGuardState() {
  return {
    showConfirm: computed(() => showConfirm.value),
    blockingNavigation: computed(() => blockingNavigation.value),
  };
}
