const http = require("http"),
  util = require('util'),
  dns = require('dns'),
  lookup = util.promisify(dns.lookup);

let remoteIP = "0.0.0.0";

module.exports = async function (client) {
  const c = client.config;
  try {
    remoteIP = await lookup(c.ipServerMC)
    remoteIP = remoteIP.address
    console.log("L'ip du serveur Minecraft " + c.ipServerMC + " est : " + remoteIP)
  } catch (error) {
    console.error(error)
  }

  const server = http.createServer(function (request, response) {
    if(request.connection.remoteAddress !== remoteIP){
      var html = `
      <style>@import url("https://fonts.googleapis.com/css?family=Share+Tech+Mono|Montserrat:700");

      * {
          margin: 0;
          padding: 0;
          border: 0;
          font-size: 100%;
          font: inherit;
          vertical-align: baseline;
          box-sizing: border-box;
          color: inherit;
      }
      
      body {
          background-image: linear-gradient(120deg, #4f0088 0%, #000000 100%);
          height: 100vh;
      }
      
      h1 {
          font-size: 45vw;
          text-align: center;
          position: fixed;
          width: 100vw;
          z-index: 1;
          color: #ffffff26;
          text-shadow: 0 0 50px rgba(0, 0, 0, 0.07);
          top: 50%;
          transform: translateY(-50%);
          font-family: "Montserrat", monospace;
      }
      
      div {
          background: rgba(0, 0, 0, 0);
          width: 70vw;
          position: relative;
          top: 50%;
          transform: translateY(-50%);
          margin: 0 auto;
          padding: 30px 30px 10px;
          box-shadow: 0 0 150px -20px rgba(0, 0, 0, 0.5);
          z-index: 3;
      }
      
      P {
          font-family: "Share Tech Mono", monospace;
          color: #f5f5f5;
          margin: 0 0 20px;
          font-size: 17px;
          line-height: 1.2;
      }
      
      span {
          color: #f0c674;
      }
      
      i {
          color: #8abeb7;
      }
      
      div a {
          text-decoration: none;
      }
      
      b {
          color: #81a2be;
      }
      
      @keyframes slide {
          from {
              right: -100px;
              transform: rotate(360deg);
              opacity: 0;
          }
          to {
              right: 15px;
              transform: rotate(0deg);
              opacity: 1;
          }
      }
      </style>
      <h1>403</h1>
      <div><p>> <span>ERROR CODE</span>: "<i>HTTP 403 Forbidden</i>"</p>
      <p>> <span>ERROR DESCRIPTION</span>: "<i>Access Denied. You Do Not Have The Permission To Access This Page On This Server</i>"</p>
      <p>> <span>ERROR CAUSED BY</span>: "<i>ip address rejected.</i>"</p>
      </div>
            
      <script>
          var str = document.getElementsByTagName('div')[0].innerHTML.toString();
      var i = 0;
      document.getElementsByTagName('div')[0].innerHTML = "";
      
      setTimeout(function() {
          var se = setInterval(function() {
              i++;
              document.getElementsByTagName('div')[0].innerHTML = str.slice(0, i) + "|";
              if (i == str.length) {
                  clearInterval(se);
                  document.getElementsByTagName('div')[0].innerHTML = str;
              }
          }, 10);
      },0);
      </script>`;
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(html);
    } else if (request.method == "POST") {
      console.dir(request.param);
      console.log("POST");
      var body = "";
      request.on("data", function (data) {
        body += data;
        console.log("Partial body: " + body);
      });
      request.on("end", function () {
        console.log("Body: " + body);
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end("post received");
      });
    }
  });

  const port = c.listenPort.apiVerif;
  const host = c.ipLocal;
  server.listen(port, host);
  console.log(`Listening at http://${host}:${port}`);
};
