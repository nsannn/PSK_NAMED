using System.Diagnostics;
using Microsoft.Extensions.Hosting;

namespace Api.Services
{
    public class StripeListenService : IHostedService, IDisposable
    {
        private Process? _process;

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "stripe",
                    // The webhook endpoint matches what is used locally
                    Arguments = "listen --forward-to http://localhost:5134/api/checkout/webhook",
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            try
            {
                _process.Start();
                Console.WriteLine("Started Stripe CLI listener automatically...");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Could not start Stripe CLI automatically: {ex.Message}. Make sure you have the Stripe CLI installed.");
            }

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            if (_process != null && !_process.HasExited)
            {
                _process.Kill(true);
                Console.WriteLine("Stopped Stripe CLI listener.");
            }
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _process?.Dispose();
        }
    }
}
