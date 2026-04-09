"""Testes para utilitários de cálculo de frequências musicais."""

import math

import pytest

from app.utils.music import A4_FREQ, note_to_freq, semitones_from_a4


class TestNoteToFreq:
    """Testes para conversão de nome de nota para frequência."""

    def test_a4_retorna_440hz(self):
        assert note_to_freq("A4") == pytest.approx(440.0, rel=1e-3)

    def test_c4_retorna_261hz(self):
        assert note_to_freq("C4") == pytest.approx(261.63, rel=1e-3)

    def test_d4_retorna_293hz(self):
        assert note_to_freq("D4") == pytest.approx(293.66, rel=1e-3)

    def test_e4_retorna_329hz(self):
        assert note_to_freq("E4") == pytest.approx(329.63, rel=1e-3)

    def test_f4_retorna_349hz(self):
        assert note_to_freq("F4") == pytest.approx(349.23, rel=1e-3)

    def test_g4_retorna_392hz(self):
        assert note_to_freq("G4") == pytest.approx(392.00, rel=1e-3)

    def test_b4_retorna_493hz(self):
        assert note_to_freq("B4") == pytest.approx(493.88, rel=1e-3)

    def test_c5_retorna_523hz(self):
        assert note_to_freq("C5") == pytest.approx(523.25, rel=1e-3)

    def test_c3_oitava_abaixo_de_c4(self):
        c3 = note_to_freq("C3")
        c4 = note_to_freq("C4")
        assert c3 == pytest.approx(c4 / 2, rel=1e-5)

    def test_c5_oitava_acima_de_c4(self):
        c4 = note_to_freq("C4")
        c5 = note_to_freq("C5")
        assert c5 == pytest.approx(c4 * 2, rel=1e-5)

    def test_sustenido_fs4(self):
        assert note_to_freq("F#4") == pytest.approx(369.99, rel=1e-3)

    def test_bemol_bb4(self):
        assert note_to_freq("Bb4") == pytest.approx(466.16, rel=1e-3)

    def test_db_igual_cs(self):
        """Db e C# devem ter a mesma frequência (enarmônicos)."""
        assert note_to_freq("Db4") == pytest.approx(note_to_freq("C#4"), rel=1e-10)

    def test_eb_igual_ds(self):
        assert note_to_freq("Eb4") == pytest.approx(note_to_freq("D#4"), rel=1e-10)

    def test_gb_igual_fs(self):
        assert note_to_freq("Gb4") == pytest.approx(note_to_freq("F#4"), rel=1e-10)

    def test_ab_igual_gs(self):
        assert note_to_freq("Ab4") == pytest.approx(note_to_freq("G#4"), rel=1e-10)

    def test_nota_invalida_tamanho_curto_levanta_valueerror(self):
        with pytest.raises(ValueError, match="Nota inválida"):
            note_to_freq("C")

    def test_nota_invalida_tamanho_longo_levanta_valueerror(self):
        with pytest.raises(ValueError, match="Nota inválida"):
            note_to_freq("Cdim4")

    def test_nome_desconhecido_levanta_valueerror(self):
        with pytest.raises(ValueError, match="Nome de nota desconhecido"):
            note_to_freq("X4")

    def test_retorna_float(self):
        assert isinstance(note_to_freq("A4"), float)


class TestSemitonesFromA4:
    """Testes para cálculo de frequência a partir de semitons de A4."""

    def test_zero_semitons_retorna_440hz(self):
        assert semitones_from_a4(0) == pytest.approx(440.0, rel=1e-10)

    def test_doze_semitons_retorna_oitava_acima(self):
        assert semitones_from_a4(12) == pytest.approx(880.0, rel=1e-5)

    def test_menos_doze_semitons_retorna_oitava_abaixo(self):
        assert semitones_from_a4(-12) == pytest.approx(220.0, rel=1e-5)

    def test_progressao_geometrica(self):
        """Cada semitom é mult por 2^(1/12)."""
        ratio = semitones_from_a4(1) / semitones_from_a4(0)
        assert ratio == pytest.approx(math.pow(2, 1 / 12), rel=1e-10)

    def test_retorna_float(self):
        assert isinstance(semitones_from_a4(0), float)
