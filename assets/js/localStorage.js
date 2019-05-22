export default {
  setString(key, str = null) {
    return localStorage.setItem(key, str);
  },
  getString(key, defaultStr = null) {
    return localStorage.getItem(key) || defaultStr;
  },
  setObject(key, obj = {}) {
    return localStorage.setItem(key, JSON.stringify(obj));
  },
  getObject(key, defaultObj = {}) {
    const val = localStorage.getItem(key);
    return (val ? JSON.parse(val) : defaultObj);
  },
  remove(key) {
    return localStorage.removeItem(key);
  },
};
