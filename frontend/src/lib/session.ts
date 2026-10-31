export function beginSession() {
  localStorage.setItem('sud_admin_session', '1');
}

export function endSession(redirectTo: string = '/admin') {
  localStorage.removeItem('sud_admin_session');
  window.location.assign(redirectTo);
}

export function isAdminSessionActive() {
  return localStorage.getItem('sud_admin_session') === '1';
}
