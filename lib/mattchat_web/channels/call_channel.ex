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

  def handle_in("hangup:" <> on_username, _params, socket) do
    broadcast!(socket, "hangup:" <> on_username, %{
      caller: current_user(socket).username
    })

    {:noreply, socket}
  end

  def handle_in("accept_call:" <> from_username, _params, socket) do
    broadcast!(socket, "call_accepted:" <> from_username, %{
      callee: current_user(socket).username
    })

    {:noreply, socket}
  end

  def handle_in("busy:" <> to_username, _params, socket) do
    broadcast!(socket, "busy:" <> to_username, %{
      user: current_user(socket).username
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