defmodule MattchatWeb.ChatController do
  use MattchatWeb, :controller

  alias Mattchat.ChatService

  def index(conn, _params) do
    messages = ChatService.messages(%{
      order: :asc,
      limit: 20,
      filter: %{
        channel: "global"
      }
    })
    user = Guardian.Plug.current_resource(conn)
    conn
    |> assign(:auth_token, Mattchat.Accounts.access_token(user))
    |> assign(:current_user, user)
    |> assign(:messages, messages)
    |> render "index.html"
  end

  def test(conn, _params) do
    conn
    |> render "test.html"
  end
end