
var  username = '';
$(document).ready(function() {
    listOnlineUsers();
	var host = window.location.host //.split(':')[0];
    var socket = new io.connect('http://' + host, {
        reconnect: false,
        'try multiple transports': false,
        'force new connection': false
    });

    $.get('/getProfile', function(data) {
    	email = data.email;
    	fullname = data.firstname + ' ' + data.lastname;
    	username = data.username;
        pic = data.profilePicture;
        id = data.id;
        
    	var msg = {
        	type:'chatUser',
        	user:fullname,
            pic:pic,
            email: email,
            id: id,
            username: username                 
        };
        socket.json.send(msg);
    });

    var content = $('.chat');

    socket.on('connect', function() {
        console.log("Connected");
    });

    socket.on('message', function(channel,message){
        if(channel == "typing"){
            var msg = message.split(':'); 
            if(msg[0] != username){
                $('.textTyping').show();
                $('.textTyping').html(msg[1]+" is typing...");    
            }      
        }else{
            var objData = {
                'message' : message
            };
            var msgRow = generateRow(objData);
            content.append(msgRow);
            scrollDownDiv();   
        }
    	
    });

    socket.on('disconnect', function() {
        console.log('disconnected');
        var objData = {
            'message' : 'Chat room is empty.'
        };
        var infoAlert = getInfoAlert(objData);
        content.append(infoAlert);
    });

    $("#btn-send-chat").click(function(){        	
        var msg = {
        	type: 'chat',
        	message: $("input[name=chat-content]").val() + ":" + fullname + ':' + pic + ':' + username
        }
        socket.json.send(msg);
        $("input[name=chat-content]").val("");
    });

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
});    

function generateRow(data) {
	var currentTime = getCurrentTime();
	var dataArr = data.message.split(':');    
	var msg = dataArr[0] ;
	var user = dataArr[1] ;
    var pic = dataArr[2];
    var chatUsername = dataArr[3];
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
     }

     if(pic == 'null') {
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

function listOnlineUsers() {
    $.get('/showOnlineUsers', function(arr) {
        $.each( arr, function( key, value ) {
          if(value !== null) {
                var data = value.split(':');
                var name = data[1];
                var pic = data[2];
                var imgPath = '';
                if(pic === 'null') {
                    imgPath = './images/default.png';
                }
                else {
                    imgPath = './uploads/'+pic;
                }
                var userList = '<li class="list-group-item"> <span class="chat-img  pull-left"><img src="' + imgPath + '" alt="User Avatar" class="img-circle user-list-pic"></span> <span class="pdleft8 valignbmiddle">' + name + '</li>';
                $('#user-list ul').append(userList);
           }
        });       
    });
}

function getInfoAlert(data) {
    var infoAlert = "<div class=\"alert alert-info\"><strong>Info!</strong> " + data.message + "</div>";
    return infoAlert;
}

function getCurrentTime() {
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];    
    var currentTime = new Date();
        currentTime = currentTime.getDate() + ' ' 
                      + monthNames[Number(currentTime.getMonth() + 1)] + ' '
                      + currentTime.getFullYear() + ' ' 
                      + currentTime.getHours() + ':' 
                      + currentTime.getMinutes();
        return currentTime;     
}

function scrollDownDiv() {
    $("#mainChat").animate({ scrollTop: 9999 }, 'fast');
}

function getOnlineUserCount() {
    $.get('/onlineUserCount', function(data) {
        $('#ou').html(data.count);
    });
    $('.textTyping').hide();
}

setInterval(getOnlineUserCount, 3000);
