defmodule MattchatWeb.ChatController do
  use MattchatWeb, :controller

  alias Mattchat.ChatService
  alias MattchatWeb.TwilioToken

  require Logger

  def index(conn, _params) do
    messages = ChatService.messages(%{
      order: :asc,
      limit: 20,
      filter: %{
        channel: "global"
      }
    })
    user = Guardian.Plug.current_resource(conn)
    tw_token = TwilioToken.for_video(user.username)
    conn
    |> assign(:auth_token, Mattchat.Accounts.access_token(user))
    |> assign(:current_user, user)
    |> assign(:messages, messages)
    |> assign(:tw_token, tw_token)
    |> render "index.html"
  end

  def test(conn, _params) do
    conn
    |> render "test.html"
  end
end