defmodule Mattchat.Channel do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:name, :string, []}
  @derive {Phoenix.Param, key: :name}
  schema "channels" do
    has_many :messages, Mattchat.Chat

    timestamps()
  end

  @doc false
  def changeset(channel, attrs) do
    channel
    |> cast(attrs, [:name])
    |> validate_required([:name])
  end

end
