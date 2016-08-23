var  username = '';
var online_user_names = [];
var existing_count = 0;

$(document).ready(function() {
    
	var host = window.location.host;
    var content = $('.chat');

    var socket = new io.connect('http://' + host, {
        reconnect: false,
        'try multiple transports': false,
        'force new connection': false
    });

    $.get('/getProfile', function(data) {

    	email = data.email;
    	fullname = data.firstname + ' ' + data.lastname;
        shortname = data.firstname.charAt(0).toUpperCase() + ' ' + data.lastname.charAt(0).toUpperCase();
    	username = data.username;
        pic = data.profilePicture;
        id = data.id;
        
    	var msg = {
        	fullname:fullname,
            pic:pic,
            email: email,
            id: id,
            username: username,
            shortname:shortname                 
        };

        socket.emit('user_details',msg);
    });

    socket.on('connect', function() {
        console.log("Connected");
        socket.emit('join', {username:username});
    });

    socket.on("typing", function(message) {
        if(message.uname != username){
            $('.textTyping').show();
            $('.textTyping').html(message.name+" is typing...");    
        }  
    }); 

    socket.on("public_message", function(message) {
            var msgRow = generateRow(message);
            content.append(msgRow);
            scrollDownDiv(); 
    }); 

    socket.on("private_message", function(data) {

            var msg = data.message; 
            var id = data.id;
            
            if($('.DemoContainer'+id).is(':visible') == false){
                $('#modalDragOnTitle'+id).click();    
            }

            var msgRow = generateRowPrivate(data);
            var private_content = $('.chat'+id);

            private_content.append(msgRow);
            scrollDownPrivateDiv(id);  
    });

    socket.on('disconnect', function() {
        console.log('disconnected');
        var msg = {
            'message' : 'Chat room is empty.'
        };
        var infoAlert = getInfoAlert(msg);
        content.append(infoAlert);
    });

    //Purpose: To send message to public chat window on click event.
    $("#btn-send-chat").click(function(){        	
        var message = $("input[name=chat-content]").val();
        var msg_with_user = {
            message : message,
            fullname : fullname,
            pic : pic,
            username: username
        };

        if($.trim(message).length > 0) {
            socket.emit('public_chat',msg_with_user);
            $("input[name=chat-content]").val("");
        }
    });

    //Purpose: To send message to private chat window on click event.
    $('body').on('click', '.btn-sm', function(){    
        var id = $(this).attr('id');
        var message = $("input[name=chat-private-content-"+id+"]").val();
        var toUser = online_user_names[id];
        
        var private_msg_with_user = {
            message : message,
            shortname : shortname,
            pic : pic,
            username: username,
            id: id,
            toUser: toUser,
        };

        // var msg = {
        //     type: 'private-chat',
        //     //message: message + ":" + shortname + ':' + pic + ':' + username+ ':' + id+ ':' + toUser
        // }

        if($.trim(message).length > 0) {
            socket.emit('private_chat', private_msg_with_user);
            $("input[name=chat-private-content-"+id+"]").val("");
        }
    });

    //Purpose: To send typing hint to all online users of public chat window on key down event.
    $('input[name=chat-content]').keydown(function(event) {
        
        if (event.keyCode == 13) {
          $('#btn-send-chat').click();
          scrollDownDiv();
        }
        
        var typeDetails = {
            name: fullname,
            uname: username
        }

        socket.emit("typing",typeDetails);
    });

    //Purpose: To send typing hint to target user inside private chat window on key down event.
    $('body').on('keydown','.private-control', function(event) {
    
        var id = $(this).attr('id').split('-')[3];

        if (event.keyCode == 13) {
              $('.btn-sm').click();
              scrollDownPrivateDiv();
        }

        var typeDetails = {
            name: fullname,
            uname: username,
            id:id
        }

        socket.emit("private-typing",typeDetails);
    });
});    

//Purpose: To generate chat message in private chat window.
function generateRowPrivate(data) {
    var currentTime = getCurrentTime();
    
    var msg = data.message;
    var user = data.shortname;
    var pic = data.pic;
    var chatUsername = data.username;
    var imgPath = '';

    var alignRow = "pull-left";
    var hideRow = "";
    var hideOtherUserData = "";
    var picStyle = "";

    if(chatUsername == username){
           alignRow = "right";
           user = "You";
           chatUsername = "You";
           hideOtherUserData = "hide";
           picStyle = "style='display:none'"
    }
   
    if(msg =="is connected in chat room" && chatUsername == username){
             hideRow = "hide";
    }

    if(pic == null) {
        imgPath = './images/default.png';
    } 
    else {
        imgPath = './uploads/' + pic;
    }

    var msgRow = "<li class=\"left clearfix " + hideRow + "\"><span class=\"chat-img  " + alignRow + "\">";
    msgRow += "<img src=\"" + imgPath + "\" "+picStyle+" alt=\"User Avatar\" width='25px' height ='25px' class=\"private-user-pic" + hideOtherUserData + "\"></span>";
    msgRow += "<div style='padding-left:10px;' class=\"chat-body clearfix " + alignRow + "\">";
    msgRow += "<div class=\"header\">";
    msgRow += "<strong class=\"primary-font\">" + user + ": </strong>";
    msgRow += "<span class=\"chat_msg\">" + msg + "</span></div></div></li>";
    return msgRow;    
}

//Purpose: To generate chat message in public chat window.
function generateRow(data) {
    var currentTime = getCurrentTime();
    
    var msg = data.message;
    var user = data.fullname;
    var pic = data.pic;
    var chatUsername = data.username;
    var imgPath = '';

    var alignRow = "pull-left";
    var hideRow = "";
    var hideOtherUserData = "";

    if(chatUsername == username){
           alignRow = "right";
           user = "You";
           hideOtherUserData = "hide";
    }

    if(msg =="is connected in chat room" && chatUsername == username){
             hideRow = "hide";
             console.log("me....");
    }

    if(pic == null) {
        imgPath = './images/default.png';
    } 
    else {
        imgPath = './uploads/' + pic;
    }

    var msgRow = "<li class=\"left clearfix " + hideRow + "\"><span class=\"chat-img  " + alignRow + "\">";
    msgRow += "<img src=\"" + imgPath + "\" alt=\"User Avatar\" class=\"img-circle user-pic " + hideOtherUserData + "\"></span>";
    msgRow += "<div class=\"chat-body clearfix " + alignRow + "\">";
    msgRow += "<div class=\"header\">";
    msgRow += "<strong class=\"primary-font\">" + user + "</strong> <small class=\"pull-right clearfix text-muted\">";
    msgRow += "<span class=\"glyphicon glyphicon-time\"></span>" + currentTime + "</small>";
    msgRow += "</div><p class=\"chat_msg\">" + msg + "</p></div></li>";
    return msgRow;    
}

//Purpose: To generate private chat windows for online users.
function privateContent(online_user_names,private_content_Callback){
    $('.loadInner').html('');
    
    var onlineUsers = $('#ou').text();
    for(var i=0; i<onlineUsers; i++) {
        var content = '<div class="DemoContainer'+i+'"><div class="panel-body panel-body-small-custom" id="smallChat'+i+'"><ul class="chat'+i+' chatNoStyle" style="list-style:none;margin: 0;padding: 0;"></ul><span class="typing'+i+'"><small class="textTyping'+i+'"></small></span></div><div class="panel-footer"><div class="input-group"><input id="chat-private-content-'+i+'" name="chat-private-content-'+i+'" type="text" value="" class="form-control private-control input-sm" placeholder="Type your message here..."><span class="input-group-btn"><button class="btn btn-warning btn-sm" id="'+i+'" name="btn-send-private-chat">Send</button></span></div></div></div>';

        $('.loadInner').append(content);


        new jBox('Modal', {
            attach: $('#modalDragOnTitle'+i),
            width: 400,
            title: '<span class="glyphicon glyphicon-comment"></span>'+$('#modalDragOnTitle'+i).text(),
            overlay: false,
            content: $('.DemoContainer'+i),
            draggable: 'title',
            repositionOnOpen: false,
            repositionOnContent: false
        });
    }
}

//Purpose: To generate list of online users.
function listOnlineUsers(online_users_callback) {
    online_user_names = [];

    $.get('/showOnlineUsers', function(arr) {
        $('#user-list ul').empty();
        var count = 0;
        
        $.each( arr, function( key, value ) {
          if(value !== null) {
                var data = value.split(':');
                var name = data[1];
                var pic = data[2];
                var id = data[3];
                var username = data[4];
                var imgPath = '';
                if(pic === 'null') {
                    imgPath = './images/default.png';
                }
                else {
                    imgPath = './uploads/'+pic;
                }
                if (!$('.list-group-item').hasClass("c-"+id)) {
                    var userList = '<li id="modalDragOnTitle'+(count)+'" class="list-group-item c-'+id+'"> <span class="chat-img  pull-left"><img src="' + imgPath + '" alt="User Avatar" class="img-circle user-list-pic"></span> <span class="pdleft8 valignbmiddle">' + name + '</li>';
                }

                $('#user-list ul').append(userList);
                online_user_names.push(username);
                count++;
           }           
        }); 

        online_users_callback(null,online_user_names);
    });    
}

//Purpose: To get number of online users.
function getOnlineUserCount() {
    $.get('/onlineUserCount', function(data) {

        $('#ou').html(data.count);
        var onlineUsers = data.count;
        
        if(data.count !== existing_count){
            existing_count = data.count;
            async.waterfall([listOnlineUsers,privateContent],
                function(err){
                  console.log(err);
                }
            );
        }
    });
    $('.textTyping').hide();
}

//Purpose: To get alert information.
function getInfoAlert(data) {
    var infoAlert = "<div class=\"alert alert-info\"><strong>Info!</strong> " + data.message + "</div>";
    return infoAlert;
}

//Purpose: To get current time.
function getCurrentTime() {
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];    
    var currentTime = new Date();
        currentTime = currentTime.getDate() + ' ' 
                      + monthNames[parseInt(currentTime.getMonth())] + ' '
                      + currentTime.getFullYear() + ' ' 
                      + currentTime.getHours() + ':' 
                      + currentTime.getMinutes();
        return currentTime;     
}

//Purpose: To scroll down to bottom in public chat window.
function scrollDownDiv() {
    $("#mainChat").animate({ scrollTop: 9999 }, 'fast');
}

//Purpose: To scroll down to bottom in private chat window.
function scrollDownPrivateDiv(id) {
    $("#smallChat"+id).animate({ scrollTop: 9999 }, 'fast');
}

//Purpose: To check for new online users after every 3 seconds.
window.setInterval(function(){
  getOnlineUserCount();
}, 3000);
