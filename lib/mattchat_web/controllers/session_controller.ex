defmodule MattchatWeb.SessionController do
  use MattchatWeb, :controller

  alias Mattchat.Accounts
  # alias Mattchat.Accounts.User
  alias Mattchat.Accounts.Guardian

  def create(conn, %{"username" => user, "password" => password}) do
    case Accounts.authenticate_user(user, password) do
      {:ok, user} ->
        conn
        |> login(user)
        |> put_flash(:info, "Welcome back!")
        |> redirect(to: chat_path(conn, :index))
  
      {:error, reason} ->
        conn
        |> put_flash(:error, reason)
        |> redirect(to: page_path(conn, :index))
    end
  end

  def destroy(conn, _) do
    conn
    |> logout()
    |> put_flash(:info, "Goodbye!")
    |> redirect(to: page_path(conn, :index))
  end

  defp login(conn, user) do
    conn
    |> Guardian.Plug.sign_in(user)
    |> assign(:current_user, user)
  end

  defp logout(conn) do
    conn
    |> Guardian.Plug.sign_out()
  end

  defp unauthenticated(conn, _params) do
    conn
    |> put_flash(:error, "Unauthenticated!")
    |> redirect(to: page_path(conn, :index))
  end
end