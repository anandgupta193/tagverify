package com.anand.tagverify.fitment

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.anand.tagverify.data.CertificateRepository
import com.anand.tagverify.data.MasterData
import com.anand.tagverify.data.QrContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

sealed interface LocationStatus {
    data object Unknown : LocationStatus
    data object Fetching : LocationStatus
    data object NeedsPermission : LocationStatus
    data object ServicesOff : LocationStatus
    data object Failed : LocationStatus
    data class Ready(val location: FitmentLocation) : LocationStatus
}

sealed interface SubmitStatus {
    data object Idle : SubmitStatus
    data class Uploading(val progress: Float) : SubmitStatus
    data class Done(val certificateNo: String) : SubmitStatus
    data class Failed(val message: String) : SubmitStatus
}

data class FitmentUiState(
    val qr: QrContext? = null,
    val form: FitmentForm = FitmentForm(),
    val masters: MasterData = MasterData.DEFAULT,
    val location: LocationStatus = LocationStatus.Unknown,
    /** Show field errors only after the dealer tries to continue. */
    val showErrors: Boolean = false,
    val confirmed: Boolean = false,
    val submit: SubmitStatus = SubmitStatus.Idle,
) {
    val locationValue: FitmentLocation? get() = (location as? LocationStatus.Ready)?.location
    val errors: Map<String, String> get() = form.errors(locationValue)
}

/** Shared by the fitment form and the verify screen for one scanned QR. */
class FitmentViewModel(app: Application) : AndroidViewModel(app) {
    private val _state = MutableStateFlow(FitmentUiState())
    val state: StateFlow<FitmentUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val masters = MasterData.load()
            _state.update { it.copy(masters = masters) }
        }
    }

    /** Start a fresh form for a newly scanned sticker. */
    fun start(qr: QrContext) {
        if (_state.value.qr?.qrId == qr.qrId && _state.value.submit !is SubmitStatus.Done) return
        _state.update { FitmentUiState(qr = qr, masters = it.masters, location = it.location) }
    }

    fun edit(transform: FitmentForm.() -> FitmentForm) = _state.update { it.copy(form = it.form.transform()) }

    fun setPhoto(slot: PhotoSlot, uri: Uri) = edit { copy(photos = photos + (slot to uri)) }

    fun setConfirmed(value: Boolean) = _state.update { it.copy(confirmed = value) }

    fun setLocationStatus(status: LocationStatus) = _state.update { it.copy(location = status) }

    fun refreshLocation() {
        val ctx = getApplication<Application>()
        if (!LocationProvider.isLocationOn(ctx)) {
            setLocationStatus(LocationStatus.ServicesOff)
            return
        }
        setLocationStatus(LocationStatus.Fetching)
        viewModelScope.launch {
            val loc = LocationProvider.current(ctx)
            setLocationStatus(if (loc != null) LocationStatus.Ready(loc) else LocationStatus.Failed)
        }
    }

    /** True when the form is complete; otherwise turns on error display. */
    fun validateForReview(): Boolean {
        val ok = _state.value.errors.isEmpty()
        _state.update { it.copy(showErrors = !ok) }
        return ok
    }

    fun generate(dealerEmail: String, dealerName: String) {
        val s = _state.value
        val qr = s.qr ?: return
        val loc = s.locationValue ?: return
        if (!s.confirmed || s.errors.isNotEmpty() || s.submit is SubmitStatus.Uploading) return
        _state.update { it.copy(submit = SubmitStatus.Uploading(0f)) }
        viewModelScope.launch {
            try {
                val certNo = CertificateRepository.submit(
                    context = getApplication(),
                    qr = qr,
                    form = s.form,
                    location = loc,
                    dealerEmail = dealerEmail,
                    dealerName = dealerName,
                    onProgress = { p -> _state.update { it.copy(submit = SubmitStatus.Uploading(p)) } },
                )
                _state.update { it.copy(submit = SubmitStatus.Done(certNo)) }
            } catch (e: Exception) {
                _state.update { it.copy(submit = SubmitStatus.Failed(e.localizedMessage ?: "Couldn't generate the certificate. Try again.")) }
            }
        }
    }

    fun clearSubmitError() = _state.update { if (it.submit is SubmitStatus.Failed) it.copy(submit = SubmitStatus.Idle) else it }
}
