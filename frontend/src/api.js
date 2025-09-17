import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const api = axios.create({
  baseURL,
  timeout: 10000
});

export default api;




// import axios from 'axios';
// const api = axios.create({
//   baseURL: 'http://localhost:4000/api',
//   timeout: 10000
// });
// export default api;
