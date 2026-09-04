(function(){
 const loginPage=location.pathname.includes("/pages/")?"../login.html":"login.html";
 const USERS_KEY="prdmsUsers", CURRENT_KEY="prdmsCurrentUser";
 function users(){try{const d=JSON.parse(localStorage.getItem(USERS_KEY)||"[]");return Array.isArray(d)?d:[]}catch(e){return[]}}
 function saveUsers(list){localStorage.setItem(USERS_KEY,JSON.stringify(list))}
 function stamp(){return new Date().toISOString()}
 function seed(){if(!users().length)saveUsers([{id:"admin",password:"admin123",name:"PRDMS Administrator",role:"Admin",createdAt:stamp(),updatedAt:stamp()}]);}
 seed();
 function safe(u){return {id:u.id,name:u.name||u.id,role:u.role==="Admin"?"Admin":(u.role==="Company"?"Company":"User"),companyId:u.companyId||null}}
 window.PRDMSAuth={
  users,saveUsers,
  login(id,password){
   const loginId=String(id||"").trim();
   const loginPassword=String(password||"");
   let list=users();

   // Recover the built-in administrator login if an older browser session
   // contains a stale/corrupt PRDMS user list.
   if(loginId.toLowerCase()==="admin" && loginPassword==="admin123"){
     let admin=list.find(x=>String(x.id||"").trim().toLowerCase()==="admin");
     if(!admin){
       admin={id:"admin",password:"admin123",name:"PRDMS Administrator",role:"Admin",createdAt:stamp(),updatedAt:stamp()};
       list.push(admin);
     }else{
       admin.id="admin";
       admin.password="admin123";
       admin.name=admin.name||"PRDMS Administrator";
       admin.role="Admin";
       admin.updatedAt=stamp();
     }
     saveUsers(list);
     const s=safe(admin);
     localStorage.setItem(CURRENT_KEY,JSON.stringify(s));
     return{ok:true,user:s};
   }

   const u=list.find(x=>String(x.id).toLowerCase()===loginId.toLowerCase()&&x.password===loginPassword);
   if(!u)return{ok:false,message:"Invalid User ID or Password."};
   const s=safe(u);localStorage.setItem(CURRENT_KEY,JSON.stringify(s));return{ok:true,user:s};
  },
  current(){try{return JSON.parse(localStorage.getItem(CURRENT_KEY)||"null")}catch(e){return null}},
  isAdmin(){return this.current()?.role==="Admin"},
  requireLogin(){if(!this.current()){location.replace(loginPage);return false}return true},
  requireAdmin(){if(!this.requireLogin())return false;if(!this.isAdmin()){alert("Admin access is required.");location.href=location.pathname.includes("/pages/")?"../index.html":"index.html";return false}return true},
  createUser(data){const list=users(),id=String(data.id||"").trim(),name=String(data.name||"").trim(),password=String(data.password||"");if(!id||!name||!password)return{ok:false,message:"User ID, User Name and Password are required."};if(list.some(u=>u.id.toLowerCase()===id.toLowerCase()))return{ok:false,message:"User ID already exists."};list.push({id,name,password,role:data.role==="Admin"?"Admin":(data.role==="Company"?"Company":"User"),companyId:data.companyId||null,createdAt:stamp(),updatedAt:stamp()});saveUsers(list);return{ok:true};},
  updateUser(originalId,data){const list=users(),i=list.findIndex(u=>u.id===originalId);if(i<0)return{ok:false,message:"User not found."};const id=String(data.id||"").trim(),name=String(data.name||"").trim();if(!id||!name)return{ok:false,message:"User ID and User Name are required."};if(list.some((u,x)=>x!==i&&u.id.toLowerCase()===id.toLowerCase()))return{ok:false,message:"User ID already exists."};const old=list[i];list[i]={...old,id,name,role:data.role==="Admin"?"Admin":(data.role==="Company"?"Company":"User"),companyId:data.companyId||null,updatedAt:stamp()};if(data.password)list[i].password=String(data.password);saveUsers(list);const c=this.current();if(c&&c.id===originalId)localStorage.setItem(CURRENT_KEY,JSON.stringify(safe(list[i])));return{ok:true};},
  deleteUser(id){const list=users();if(id==="admin")return{ok:false,message:"Default admin cannot be deleted."};if(this.current()?.id===id)return{ok:false,message:"You cannot delete the currently logged-in user."};const next=list.filter(u=>u.id!==id);if(next.length===list.length)return{ok:false,message:"User not found."};saveUsers(next);return{ok:true};},
  changeOwnPassword(oldPassword,newPassword){const c=this.current();if(!c)return{ok:false,message:"Not logged in."};const list=users(),i=list.findIndex(u=>u.id===c.id);if(i<0||list[i].password!==oldPassword)return{ok:false,message:"Current password is incorrect."};if(String(newPassword).length<4)return{ok:false,message:"New password must contain at least 4 characters."};list[i].password=String(newPassword);list[i].updatedAt=stamp();saveUsers(list);return{ok:true};},
  logout(){localStorage.removeItem(CURRENT_KEY);location.href=loginPage}
 };
 if(document.body&&!document.body.classList.contains("login-page")&&!document.body.classList.contains("company-portal-page")){if(!PRDMSAuth.requireLogin())return;document.addEventListener("DOMContentLoaded",()=>{const u=PRDMSAuth.current();document.querySelectorAll("[data-user-name]").forEach(e=>e.textContent=u?.name||"User");document.querySelectorAll("[data-user-role]").forEach(e=>e.textContent=u?.role||"User");});}
})();