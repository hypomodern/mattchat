const chatContainer = document.querySelector("#chat-test")

if (chatContainer) {

  var Peer = require('simple-peer')
  var p = new Peer({
    initiator: location.hash === '#1',
    trickle: false,
    config: {
      iceServers: [
        {
          urls: "stun:numb.viagenie.ca",
          username: "mhw@hypomodern.com",
          credential: "tf02bls"
        },
        {
          urls: "turn:numb.viagenie.ca",
          username: "mhw@hypomodern.com",
          credential: "tf02bls"
        }
      ]
    }
  })

  p.on('error', function (err) { console.log('error', err) })

  p.on('signal', function (data) {
    console.log('SIGNAL', JSON.stringify(data))
    document.querySelector('#outgoing').textContent = JSON.stringify(data)
  })

  document.querySelector('form').addEventListener('submit', function (ev) {
    ev.preventDefault()
    p.signal(JSON.parse(document.querySelector('#incoming').value))
  })

  p.on('connect', function () {
    console.log('CONNECT')
    p.send('whatever' + Math.random())
  })

  p.on('data', function (data) {
    console.log('data: ' + data)
  })

}