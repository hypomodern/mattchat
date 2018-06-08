defmodule MattchatWeb.Presence do
  use Phoenix.Presence,
    otp_app: :mattchat,
    pubsub_server: Mattchat.PubSub
end
