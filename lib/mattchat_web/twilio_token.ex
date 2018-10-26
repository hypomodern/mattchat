defmodule MattchatWeb.TwilioToken do
  # Generates token for Twilio Programmable video
  # Assumes Joken is in Mix.exs deps and Twilio creds are in app config
  def for_video(identity) do
    config = config()
    sid = config[:TWILIO_ACCOUNT_SID]
    api_key = config[:TWILIO_API_KEY]
    api_secret = config[:TWILIO_API_SECRET]
    now = epoch_ts()
    exp = now + 3600

    payload = %{
      "jti" => "#{api_key}-#{now}",
      "iss" => api_key,
      "sub" => sid,
      "exp" => exp,
      "grants" => %{
        "identity" => identity,
        "video" => %{}
      }
    }

    payload
    |> Joken.token()
    |> Joken.with_header_arg("cty", "twilio-fpa;v=1")
    |> Joken.with_signer(Joken.hs256(api_secret))
    |> Joken.sign()
    |> Joken.get_compact()
  end

  defp epoch_ts() do
    epoch = {{1970, 1, 1}, {0, 0, 0}}
    epoch_i = :calendar.datetime_to_gregorian_seconds(epoch)
    now_i = :calendar.datetime_to_gregorian_seconds(:calendar.universal_time)
    now_i - epoch_i
  end

  def config() do
    %{
      TWILIO_ACCOUNT_SID: System.get_env("TWILIO_ACCOUNT_SID"),
      TWILIO_API_KEY: System.get_env("TWILIO_API_KEY"),
      TWILIO_API_SECRET: System.get_env("TWILIO_API_SECRET"),
    }
  end
end