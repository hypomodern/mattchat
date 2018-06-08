defmodule MattchatWeb.ChatController do
  use MattchatWeb, :controller

  def index(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    conn
    |> assign(:auth_token, Mattchat.Accounts.access_token(user))
    |> render "index.html"
  end
end