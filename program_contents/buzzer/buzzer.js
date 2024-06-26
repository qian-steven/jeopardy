// buzzer script

var player_names = [];
        
var server_ip_address = window.location.href.replace("http://","").replace("https://","").split(":")[0].split("/")[0];
var buzzer_socket;
setup_buzzer_socket();
ping_server(500);

var last_seen_test_num = 0;
var current_test_num = 0;

var activeConnection = false;

var test_connection_interval = 0;


// Buzzer function
function buzz_in() {
    buzzer_socket.send("buzz:" + player_names[document.getElementById("player_select").value] + "," + Date.now());
}

function setup_buzzer_socket() {
    if (buzzer_socket != null) {
        buzzer_socket.close();
    }

    buzzer_socket = new WebSocket("ws://"+server_ip_address+":8001");

    buzzer_socket.onmessage = function (event) {
        var socket_message = event.data;
        if (socket_message.split(":").length != 2) {
            return;
        }
        var message_type = socket_message.split(":")[0];
        var message_content = socket_message.split(":")[1];
        if (message_type == "player_names") {
            player_names = message_content.split(",");

            var player_info_link = document.getElementById("player_select");
            while (player_info_link.firstChild) {
                player_info_link.removeChild(player_info_link.firstChild);
            }

            player_names.forEach (function(value, index) {
                var option_node = document.createElement("option");
                option_node.id = "player"+index+"_select";
                option_node.value = index;
                option_node.innerHTML = value;
                player_info_link.appendChild(option_node);
            });

            if (get_cookie("jeopardy_player_name") != null && player_names.includes(get_cookie("jeopardy_player_name"))) {
                document.getElementById("player_select").value = player_names.indexOf(get_cookie("jeopardy_player_name"));
            }
            
        } else if (message_type == "test_response") {
            last_seen_test_num = parseInt(message_content);
        }
    }

    buzzer_socket.onopen = function () {
        buzzer_socket.send("get_player_names:");
    }

    buzzer_socket.onclose = function() {
        attempt_reconnect(50);
    }

}

function attempt_reconnect(wait_time) {
    setTimeout(() => {
        if (buzzer_socket.readyState == WebSocket.CLOSED) {
            setup_buzzer_socket();
            attempt_reconnect(wait_time*2)
        } else {
            ping_server(500);
        }
    }, wait_time);
}

function ping_server(wait_time) {
    clearInterval(test_connection_interval);
    test_connection_interval = setInterval(function() {
        current_test_num += 1;
        buzzer_socket.send("test:" + current_test_num);

        if (current_test_num - 2 > last_seen_test_num) {
            if (activeConnection && current_test_num - 6 > last_seen_test_num) {
                activeConnection = false;
                document.getElementById("connection_status").innerHTML = "Disconnected and having trouble reconnecting. Please reload page.";
                document.getElementById("buzz_button").className = "btn btn-secondary";
            }
            attempt_reconnect(50);
        } else {
            if (!activeConnection) {
                activeConnection = true;
                document.getElementById("connection_status").innerHTML = "Connection Active.";
                document.getElementById("buzz_button").className = "btn btn-danger";
            }
            // Once every three seconds reload players
            if (current_test_num % (1000 / wait_time * 3) == 0) { 
                buzzer_socket.send("get_player_names:");
            }
        }
    }, wait_time);
}

function update_name_cookie(){
    set_cookie("jeopardy_player_name", player_names[document.getElementById("player_select").value], 1);
}

function set_cookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function get_cookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}