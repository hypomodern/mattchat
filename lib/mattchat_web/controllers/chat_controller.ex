defmodule MattchatWeb.ChatController do
  use MattchatWeb, :controller

  alias Mattchat.ChatService
  alias MattchatWeb.TwilioToken

  require Logger

  def index(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    tw_token = TwilioToken.for_video(user.username)
    conn
    |> assign(:auth_token, Mattchat.Accounts.access_token(user))
    |> assign(:current_user, user)
    # |> assign(:messages, messages)
    # |> assign(:channels, channels)
    |> assign(:tw_token, tw_token)
    |> put_layout("chat.html")
    |> render("index.html")
  end
end