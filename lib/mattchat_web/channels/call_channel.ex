defmodule MattchatWeb.CallChannel do
  use MattchatWeb, :channel

  # alias MattchatWeb.Presence

  def join("calls", _params, socket) do
    {:ok, socket}
  end

  def handle_in("initiate_call:" <> with_username, _params, socket) do
    broadcast!(socket, "calling:" <> with_username, %{
      caller: current_user(socket).username
    })

    {:noreply, socket}
  end

  def handle_in("signal", payload, socket) do
    broadcast socket, "signal:from_#{current_user(socket).username}", payload
    {:noreply, socket}
  end

  defp current_user(socket) do
    socket.assigns.current_user
  end
end