defmodule MattchatWeb.PageController do
  use MattchatWeb, :controller

  alias Mattchat.Accounts
  alias Mattchat.Accounts.User
  alias Mattchat.Accounts.Guardian

  def index(conn, _params) do
    changeset = Accounts.change_user(%User{})
    maybe_user = Guardian.Plug.current_resource(conn)
    render conn, "index.html", changeset: changeset, maybe_user: maybe_user
  end
end
