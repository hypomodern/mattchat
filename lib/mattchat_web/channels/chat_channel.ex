defmodule MattchatWeb.ChatChannel do
  use MattchatWeb, :channel

  alias MattchatWeb.Presence
  alias Mattchat.ChatService

  def join("mattchat", _params, socket) do
    channels = ChatService.channels()

    send(self(), :after_join)
    {:ok, Enum.map(channels, fn channel -> %{ name: channel.name } end), socket}
  end

  def handle_info(:after_join, socket) do
    push(socket, "presence_state", Presence.list(socket))

    {:ok, _} =
      Presence.track(socket, current_user(socket).username, %{
        online_at: inspect(System.system_time(:seconds)),
        in_call: false
      })

    {:noreply, socket}
  end

  def handle_in("started_call", _params, socket) do
    {:ok, _} = Presence.update(socket, current_user(socket).username, %{
      in_call: true,
      online_at: inspect(System.system_time(:seconds))
    })

    {:noreply, socket}
  end

  def handle_in("ended_call", _params, socket) do
    {:ok, _} = Presence.update(socket, current_user(socket).username, %{
      in_call: false,
      online_at: inspect(System.system_time(:seconds))
    })

    {:noreply, socket}
  end

  def handle_in("create_channel", %{"name" => channel_name}, socket) do
    case ChatService.create_channel(%{name: channel_name}) do
      {:ok, channel} ->
        broadcast!(socket, "new_channel", %{name: channel.name})

        {:noreply, socket}
      {:error, %Ecto.Changeset{}} ->
        {:reply, {:error, %{message: "Channel name is taken!"}}, socket}
    end
  end

  defp current_user(socket) do
    socket.assigns.current_user
  end
end