import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";

import { roleApi } from "./api/roles";

import authSlice from "./authSlice";
import themeConfigSlice from "./themeConfigSlice";
import { companyApi } from "./api/company";
import { userApi } from "./api/user";
import { loginApi } from "./api/login";
import { documentApi } from "./api/document";
import { suppliersApi } from "./api/suppliers";
import { poDetailsApi } from "./api/po_details";
import { budgetaryPaymentsApi } from "./api/budgetary_payments";
import { requisitionsApi } from "./api/requisitions";
import { workflowApi } from "./api/workflow";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    themeConfig: themeConfigSlice,

    [roleApi.reducerPath]: roleApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [loginApi.reducerPath]: loginApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [documentApi.reducerPath]: documentApi.reducer,
    [suppliersApi.reducerPath]: suppliersApi.reducer,
    [poDetailsApi.reducerPath]: poDetailsApi.reducer,
    [budgetaryPaymentsApi.reducerPath]: budgetaryPaymentsApi.reducer,
    [requisitionsApi.reducerPath]: requisitionsApi.reducer,
    [workflowApi.reducerPath]: workflowApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(loginApi.middleware)
      .concat(roleApi.middleware)
      .concat(userApi.middleware)
      .concat(companyApi.middleware)
      .concat(documentApi.middleware)
      .concat(suppliersApi.middleware)
      .concat(poDetailsApi.middleware)
      .concat(budgetaryPaymentsApi.middleware)
      .concat(requisitionsApi.middleware)
      .concat(workflowApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);

export const resetAllState = () => {
  store.dispatch(userApi.util.resetApiState());
};
