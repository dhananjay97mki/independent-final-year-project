import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import mapReducer from './map.slice';
import cityReducer from './city.slice';
import companyReducer from './company.slice';
import chatReducer from './chat.slice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    map: mapReducer,
    city: cityReducer,
    company: companyReducer,
    chat: chatReducer
  }
});

export default store;
