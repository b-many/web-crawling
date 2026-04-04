import axios from 'axios';

const client = axios.create({ baseURL: '/api/contests' });

export const getContests = (params) => client.get('/', { params }).then((r) => r.data);
export const getContest  = (id)     => client.get(`/${id}`).then((r) => r.data);
export const createContest = (data) => client.post('/', data).then((r) => r.data);
export const updateContest = (id, data) => client.put(`/${id}`, data).then((r) => r.data);
export const deleteContest = (id)   => client.delete(`/${id}`).then((r) => r.data);
