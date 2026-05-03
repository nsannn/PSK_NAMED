let menuBtn=document.getElementById('menu_button');
let closeBtn=document.getElementById('close_button');
let mobileSidebar=document.getElementById('mobile_sidebar');
let registerWindow=document.getElementById('register_window');
let signInWindow=document.getElementById('sign_in_window');
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

function openAccountWindow(event){
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

function toggleSortMenu(){
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
    if(mobileSidebar.style.right==='0px')
        closeMobileSidebar();

    if(registerWindow.style.display==='flex')
        closeRegisterWindow();

    if(signInWindow.style.display==='flex')
        closeSignInWindow();
    if(filterMenu.style.left==='0px')
        closeFilterMenu();
}

document.addEventListener('click',(e)=>{
    if(sortContainer && !sortContainer.contains(e.target)){
        sortMenu.style.opacity='0';
        sortMenu.style.margin='2rem auto auto auto';
        setTimeout(()=>{
            sortMenu.style.display='none';
        },100);
    }
    if(accountGroup && !accountGroup.contains(e.target)){
        accountWindow.style.opacity='0';
        accountWindow.style.margin='2rem auto auto auto';
        setTimeout(()=>{
            accountWindow.style.display='none';
        },100);
    }
});