let menuBtn=document.getElementById('menu_button');
let closeBtn=document.getElementById('close_button');
let mobileSidebar=document.getElementById('mobile_sidebar');
let registerWindow=document.getElementById('register_window');
let signInWindow=document.getElementById('sign_in_window');
let deleteWindow=document.getElementById('delete_confirmation_window');
let notificationContainer=document.getElementById('notification_container');
let notificationWindow=document.getElementById('notification_window');
let accountGroup=document.getElementById('account_group');
let accountWindow=document.getElementById('account_window');
let transparentPanel=document.getElementById('transparent_panel');
let filterMenu=document.getElementById('filters_menu');
let sortContainer=document.getElementById('sort_container');
let sortMenu=document.getElementById('sort_options_menu');

function openMobileSidebar(){
    mobileSidebar.style.right='0';
    transparentPanel.style.display='block';
    setTimeout(()=>{
        transparentPanel.style.opacity='0.8';
    },100);
}

function closeMobileSidebar(){
    mobileSidebar.style.right='-320px';
    transparentPanel.style.opacity='0';
    setTimeout(()=>{
        transparentPanel.style.display='none';
    },100);
}

function openRegisterWindow(){
    registerWindow.style.display='flex';
    setTimeout(()=>{
        registerWindow.style.opacity='1';
        registerWindow.style.top='6rem';
    },100);
    transparentPanel.style.display='block';
    setTimeout(()=>{
        transparentPanel.style.opacity='0.8';
    },100);
}

function openRegisterWindowSidebar(){
    if(mobileSidebar.style.right==='0px')
        closeMobileSidebar();

    setTimeout(()=>{
        registerWindow.style.display='flex';
        setTimeout(()=>{
            registerWindow.style.opacity='1';
            registerWindow.style.top='6rem';
        },100);
        transparentPanel.style.display='block';
        setTimeout(()=>{
            transparentPanel.style.opacity='0.8';
        },100);
    },300);
}

function closeRegisterWindow(){
    registerWindow.style.opacity='0';
    registerWindow.style.top='15rem';
    setTimeout(()=>{
        registerWindow.style.display='none';
    },100);
    transparentPanel.style.opacity='0';
    setTimeout(()=>{
        transparentPanel.style.display='none';
    },100);
}

function openSignInWindow(){
    signInWindow.style.display='flex';
    setTimeout(()=>{
        signInWindow.style.opacity='1';
        signInWindow.style.top='6rem';
    },100);
    transparentPanel.style.display='block';
    setTimeout(()=>{
        transparentPanel.style.opacity='0.8';
    },100);
}

function openSignInWindowSidebar(){
    if(mobileSidebar.style.right==='0px')
        closeMobileSidebar();
    
    setTimeout(()=>{
        signInWindow.style.display='flex';
        setTimeout(()=>{
            signInWindow.style.opacity='1';
            signInWindow.style.top='6rem';
        },100);
        transparentPanel.style.display='block';
        setTimeout(()=>{
            transparentPanel.style.opacity='0.8';
        },100);
    },300);
}

function closeSignInWindow(){
    signInWindow.style.opacity='0';
    signInWindow.style.top='15rem';
    setTimeout(()=>{
        signInWindow.style.display='none';
    },100);
    transparentPanel.style.opacity='0';
    setTimeout(()=>{
        transparentPanel.style.display='none';
    },100);
}

function openNotificationWindow(event){
    if(sortMenu)
        closeSortMenu();
    if(accountWindow)
        closeAccountWindow();

    event.stopPropagation();

    if(notificationWindow.style.display==='block'){
        notificationWindow.style.opacity='0';
        notificationWindow.style.margin='2rem auto auto auto';
        setTimeout(()=>{
            notificationWindow.style.display='none';
        },100);
    } else {
        notificationWindow.style.display='block';
        setTimeout(()=>{
            notificationWindow.style.opacity='1';
            notificationWindow.style.margin='0.5rem auto auto auto';
        },100);
    }
}

function closeNotificationWindow(){
    notificationWindow.style.opacity='0';
    notificationWindow.style.margin='1.5rem auto auto auto';
    setTimeout(()=>{
        notificationWindow.style.display='none';
    },100);
}

function openAccountWindow(event){
    if(sortMenu)
        closeSortMenu();
    if(notificationWindow)
        closeNotificationWindow();

    event.stopPropagation();

    if(accountWindow.style.display==='block'){
        accountWindow.style.opacity='0';
        accountWindow.style.margin='2rem auto auto auto';
        setTimeout(()=>{
            accountWindow.style.display='none';
        },100);
    } else {
        accountWindow.style.display='block';
        setTimeout(()=>{
            accountWindow.style.opacity='1';
            accountWindow.style.margin='0.5rem auto auto auto';
        },100);
    }
}

function closeAccountWindow(){
    accountWindow.style.opacity='0';
    accountWindow.style.margin='1.5rem auto auto auto';
    setTimeout(()=>{
        accountWindow.style.display='none';
    },100);
}

function openDeleteWindow(){
    deleteWindow.style.display='flex';
    setTimeout(()=>{
        deleteWindow.style.opacity='1';
        deleteWindow.style.top='6rem';
    },100);
    transparentPanel.style.display='block';
    setTimeout(()=>{
        transparentPanel.style.opacity='0.8';
    },100);
}

function closeDeleteWindow(){
    deleteWindow.style.opacity='0';
    deleteWindow.style.top='15rem';
    setTimeout(()=>{
        deleteWindow.style.display='none';
    },100);
    transparentPanel.style.opacity='0';
    setTimeout(()=>{
        transparentPanel.style.display='none';
    },100);
}

function toggleSortMenu(){
    if(notificationWindow)
        closeNotificationWindow();
    if(accountWindow)
        closeAccountWindow();

    if(sortMenu.style.display==='block'){
        sortMenu.style.opacity='0';
        sortMenu.style.margin='2rem auto auto auto';
        setTimeout(()=>{
            sortMenu.style.display='none';
        },100);
    } else {
        sortMenu.style.display='block';
        setTimeout(()=>{
            sortMenu.style.opacity='1';
            sortMenu.style.margin='0.5rem auto auto auto';
        },100);
    }
}

function closeSortMenu(){
    sortMenu.style.opacity='0';
    sortMenu.style.margin='2rem auto auto auto';
    setTimeout(()=>{
        sortMenu.style.display='none';
    },100);
}

function openFilterMenu(){
    filterMenu.style.left='0';
    transparentPanel.style.display='block';
    setTimeout(()=>{
        transparentPanel.style.opacity='0.8';
    },100);
}

function closeFilterMenu(){
    filterMenu.style.left='-320px';
    transparentPanel.style.opacity='0';
    setTimeout(()=>{
        transparentPanel.style.display='none';
    },100);
}

function closeEverything(){
    if(mobileSidebar && mobileSidebar.style.right==='0px')
        closeMobileSidebar();

    if(registerWindow && registerWindow.style.display==='flex')
        closeRegisterWindow();

    if(signInWindow && signInWindow.style.display==='flex')
        closeSignInWindow();

    if(deleteWindow && deleteWindow.style.display==='flex'){
        console.log("Test")
        closeDeleteWindow();
    }

    if(filterMenu && filterMenu.style.left==='0px')
        closeFilterMenu();
}

document.addEventListener('click',(e)=>{
    if(sortContainer && !sortContainer.contains(e.target)){
        closeSortMenu();
    }
    if(notificationContainer && !notificationContainer.contains(e.target)){
        closeNotificationWindow();
    }
    if(accountGroup && !accountGroup.contains(e.target)){
        closeAccountWindow();
    }
});