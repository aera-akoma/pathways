import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {AdminUserManagementView} from '../src/AdminManageViews.jsx';
const account={id:'fixture-main',name:'Test Admin',email:'admin@podar.edu',phone:'9876543210',permissions:['all']};
window.fetch=async(url,options={})=>({ok:true,status:200,json:async()=>options.method?{id:'fixture-created',...JSON.parse(options.body||'{}')}:[account]});
function Fixture(){const[state,setState]=useState({admins:[account]});return <><AdminUserManagementView state={state} setState={setState} session={account} notify={message=>document.getElementById('status').textContent=message}/><p id="status" role="status"/></>};createRoot(document.getElementById('root')).render(<Fixture/>);
