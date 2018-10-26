defmodule MattchatWeb.Resolvers.Chat do
  alias Mattchat.ChatService

  def messages(_, args, _) do
    {:ok, ChatService.messages(args)}
  end

  def create_chat(_, %{input: params}, _) do
    case ChatService.create_chat(params) do
      {:error, changeset} ->
        {:ok, %{errors: transform_errors(changeset)}}
      {:ok, chat} ->
        {:ok, %{chat: chat}}
    end
  end

  defp transform_errors(changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(&format_error/1)
    |> Enum.map(fn
      {key, value} ->
        %{key: key, message: value}
    end)
  end

  @spec format_error(Ecto.Changeset.error) :: String.t
  defp format_error({msg, opts}) do
    Enum.reduce(opts, msg, fn {key, value}, acc ->
      String.replace(acc, "%{#{key}}", to_string(value))
    end)
  end

end