defmodule MattchatWeb.RoomChannel do
  use MattchatWeb, :channel

  alias MattchatWeb.Presence

  def join("room:" <> room_name, _params, socket) do
    # TODO: eventually provide the last 20 messages or w/e
    send(self(), {:after_join, room_name})
    {:ok, socket}
  end

  def handle_info({:after_join, _room_name}, socket) do
    push(socket, "presence_state", Presence.list(socket))

    {:ok, _} =
      Presence.track(socket, current_user(socket).username, %{
        online_at: inspect(System.system_time(:seconds))
      })

    {:noreply, socket}
  end

  def handle_in("new_chat_message", %{"body" => body}, socket) do
    broadcast!(socket, "new_chat_message", %{
      username: current_user(socket).username,
      body: body
    })

    {:noreply, socket}
  end

  defp current_user(socket) do
    socket.assigns.current_user
  end
end