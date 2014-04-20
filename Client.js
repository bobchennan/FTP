var net=require('net');
var fs=require('fs');

var HOST='127.0.0.1';
var PORT=21;

var client=new net.Socket();
var datalink=new net.Socket();

var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Give the address for FTP:',function(ip){
	HOST=ip;
rl.question('Give the port for FTP:',function(por){
	if(por.length>0)PORT=por;
client.connect(PORT,HOST,function(){
	console.log('CONNECT TO:' + HOST + ':' + PORT);
});
});
});

last_command="";

var handle=function(next){
    rl.question('>',function(command){
        if(command.length==0||command.toLowerCase()=="help"){
            console.log("\
ABOR - abort a file transfer\n\
CWD - change working directory\n\
DELE - delete a remote file\n\
LIST - list remote files\n\
MDTM - return the modification time of a file\n\
MKD - make a remote directory\n\
NLST - name list of remote directory\n\
PASS - send password\n\
PASV - enter passive mode\n\
PORT - open a data port\n\
PWD - print working directory\n\
QUIT - terminate the connection\n\
RETR - retrieve a remote file\n\
RMD - remove a remote directory\n\
RNFR - rename from\n\
RNTO - rename to\n\
SITE - site-specific commands\n\
SIZE - return the size of a file\n\
STOR - store a file on the remote host\n\
TYPE - set transfer type\n\
USER - send username\n");
            next(next);
        }
        else if(command.substr(0,4)=='STOR')
            fs.readFile(command.substr(5),function(err,data){
                if(err)console.log('read file error');
                else datalink.end(data);
                next(next);
            });
        else client.write(command+'\n');
        last_command=command;
    });
}

client.on('data', function(data) {
    data=data.toString();
    str=data.split(" ");
    console.log(data);
    //console.log("Command: "+str[0]);
    if(str[0].substr(0,3)=="220")
        rl.question('Username:',function(name){
            client.write("USER "+name+'\n');
        });
    else if(str[0]=="331")
        rl.question('Password:',function(name){
            client.write("PASS "+name+'\n');
        });
    else if(str[0]=='221')
        process.exit(0);
    else if(str[0]=='227'){
        var infor=data.substr(data.indexOf('(')+1,data.lastIndexOf(')')-data.indexOf('(')-1);
        //console.log(infor);
        infor2=infor.split(',');
        ip=infor2[0]+"."+infor2[1]+"."+infor2[2]+"."+infor2[3];
        port=parseInt(infor2[4])*256+parseInt(infor2[5]);
        datalink.connect(port,ip,function(){
            handle(handle);
        });
        datalink.on('data',function(data){
            if(last_command.substr(0,4)=='LIST')console.log(data.toString());
            if(last_command.substr(0,4)=='RETR')
                fs.writeFile(last_command.substr(5),data,function(err){
                    if(err)console.log('write file error');
                });
        });
    }
    else handle(handle);
});

client.on('close', function() {
    console.log('Connection closed');
});